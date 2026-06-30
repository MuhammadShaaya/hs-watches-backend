const prisma = require("../config/prisma");
const { z } = require("zod");

const couponSchema = z.object({
  code: z.string().min(3),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  expiry: z.string().or(z.date()),
  usageLimit: z.number().int().positive(),
  active: z.boolean().optional(),
});

async function listCoupons(req, res) {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json(coupons.map((c) => ({ ...c, value: Number(c.value) })));
}

async function createCoupon(req, res) {
  const data = couponSchema.parse(req.body);
  const existing = await prisma.coupon.findUnique({ where: { code: data.code.toUpperCase() } });
  if (existing) return res.status(409).json({ error: "A coupon with this code already exists" });

  const coupon = await prisma.coupon.create({
    data: { ...data, code: data.code.toUpperCase(), expiry: new Date(data.expiry), active: data.active ?? true },
  });
  res.status(201).json(coupon);
}

async function updateCoupon(req, res) {
  const data = couponSchema.partial().parse(req.body);
  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data: { ...data, ...(data.expiry && { expiry: new Date(data.expiry) }) },
  });
  res.json(coupon);
}

async function deleteCoupon(req, res) {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

async function validateCoupon(req, res) {
  const { code, subtotal } = req.body;
  const coupon = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });

  if (!coupon || !coupon.active || coupon.expiry < new Date() || coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ valid: false, message: "This coupon code is invalid or has expired" });
  }

  const discount =
    coupon.type === "PERCENTAGE"
      ? Math.round(Number(subtotal) * (Number(coupon.value) / 100) * 100) / 100
      : Math.min(Number(coupon.value), Number(subtotal));

  res.json({ valid: true, discount, coupon });
}

module.exports = { listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
