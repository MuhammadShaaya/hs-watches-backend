const prisma = require("../config/prisma");
const { createOrderSchema, updateOrderStatusSchema } = require("../utils/validators-order");
const { generateOrderNumber } = require("../utils/generators");
const { sendMail } = require("../config/mailer");

const TAX_RATE = 0.08;

async function computeCouponDiscount(code, subtotal) {
  if (!code) return { discount: 0, coupon: null };

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.active || coupon.expiry < new Date() || coupon.usedCount >= coupon.usageLimit) {
    return { discount: 0, coupon: null, invalid: true };
  }

  const discount =
    coupon.type === "PERCENTAGE"
      ? Math.round(subtotal * (Number(coupon.value) / 100) * 100) / 100
      : Math.min(Number(coupon.value), subtotal);

  return { discount, coupon };
}

async function createOrder(req, res) {
  const data = createOrderSchema.parse(req.body);
  const userId = req.user?.id ?? null;

  if (!userId && !data.guestEmail) {
    return res.status(400).json({ error: "Guest checkout requires an email address" });
  }

  // Fetch products and validate stock
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
    if (product.stock < item.quantity) {
      return res.status(409).json({ error: `Insufficient stock for "${product.name}" (${product.stock} available)` });
    }
  }

  const subtotal = data.items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    const strapDelta = 0; // resolved client-side; could be re-derived from ProductVariantOption if needed
    return sum + (Number(product.salePrice ?? product.price) + strapDelta) * item.quantity;
  }, 0);

  const { discount, coupon, invalid } = await computeCouponDiscount(data.couponCode, subtotal);
  if (invalid) return res.status(400).json({ error: "Coupon code is invalid, expired, or fully redeemed" });

  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * TAX_RATE * 100) / 100;
  const shipping = 0;
  const total = Math.round((taxable + tax + shipping) * 100) / 100;

  const address = await prisma.address.create({
    data: { ...data.shippingAddress, userId: userId ?? undefined },
  });

  const orderNumber = generateOrderNumber();
  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      guestEmail: userId ? undefined : data.guestEmail,
      addressId: address.id,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      status: "PENDING",
      paymentMethod: "COD",
      orderNotes: data.orderNotes,
      couponCode: coupon?.code,
      estimatedDelivery,
      items: {
        create: data.items.map((item) => {
          const product = productMap.get(item.productId);
          const mainImage = product.images?.[0]?.url ?? null;
          return {
            productId: item.productId,
            nameSnapshot: product.name,
            imageSnapshot: mainImage,
            unitPrice: product.salePrice ?? product.price,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedStrap: item.selectedStrap,
          };
        }),
      },
      timeline: { create: { status: "PENDING" } },
    },
    include: { items: true, timeline: true, shippingAddress: true },
  });

  // Decrement stock + log inventory changes
  await Promise.all(
    data.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    )
  );
  await Promise.all(
    data.items.map((item) =>
      prisma.inventoryLog.create({
        data: { productId: item.productId, change: -item.quantity, reason: `Order ${orderNumber}` },
      })
    )
  );

  if (coupon) {
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  }

  const recipientEmail = req.user?.email ?? data.guestEmail;
  await sendMail({
    to: recipientEmail,
    subject: `Order Confirmed — ${orderNumber}`,
    html: `<p>Thank you for your order! Your order <strong>${orderNumber}</strong> has been placed and will be paid via Cash on Delivery. Estimated delivery: ${estimatedDelivery.toDateString()}.</p>`,
  });

  res.status(201).json(serializeOrder(order));
}

async function listOrders(req, res) {
  const { status, userId } = req.query;
  const where = {};
  if (status) where.status = String(status).toUpperCase();

  // Customers only see their own orders; admins/managers see all (or filter by userId)
  if (req.user.role === "CUSTOMER") {
    where.userId = req.user.id;
  } else if (userId) {
    where.userId = String(userId);
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: true, timeline: true, shippingAddress: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(orders.map(serializeOrder));
}

async function getOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, timeline: { orderBy: { date: "asc" } }, shippingAddress: true, user: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.user.role === "CUSTOMER" && order.userId !== req.user.id) {
    return res.status(403).json({ error: "You do not have access to this order" });
  }

  res.json(serializeOrder(order));
}

async function getOrderByNumber(req, res) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true, timeline: { orderBy: { date: "asc" } }, shippingAddress: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(serializeOrder(order));
}

async function updateOrderStatus(req, res) {
  const { status } = updateOrderStatusSchema.parse(req.body);

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      status,
      timeline: { create: { status } },
    },
    include: { items: true, timeline: true, shippingAddress: true, user: true },
  });

  const recipientEmail = order.user?.email ?? order.guestEmail;
  if (recipientEmail) {
    await sendMail({
      to: recipientEmail,
      subject: `Order ${order.orderNumber} status updated: ${status}`,
      html: `<p>Your order <strong>${order.orderNumber}</strong> status has been updated to <strong>${status}</strong>.</p>`,
    });
  }

  res.json(serializeOrder(order));
}

function serializeOrder(o) {
  return {
    ...o,
    subtotal: Number(o.subtotal),
    shipping: Number(o.shipping),
    tax: Number(o.tax),
    discount: Number(o.discount),
    total: Number(o.total),
    items: o.items?.map((i) => ({ ...i, unitPrice: Number(i.unitPrice) })),
  };
}

module.exports = { createOrder, listOrders, getOrder, getOrderByNumber, updateOrderStatus };
