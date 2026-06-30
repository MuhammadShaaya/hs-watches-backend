const PDFDocument = require("pdfkit");
const prisma = require("../config/prisma");

async function generateInvoice(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, shippingAddress: true, user: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.user.role === "CUSTOMER" && order.userId !== req.user.id) {
    return res.status(403).json({ error: "You do not have access to this invoice" });
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text("H&S Watches", { align: "left" });
  doc.fontSize(10).fillColor("#666").text("Time, Refined.", { align: "left" });
  doc.moveDown(2);

  doc.fillColor("#000").fontSize(14).text(`Invoice — ${order.orderNumber}`, { align: "left" });
  doc.fontSize(10).fillColor("#444").text(`Date: ${order.createdAt.toDateString()}`);
  doc.text(`Status: ${order.status}`);
  doc.text(`Payment Method: Cash on Delivery`);
  doc.moveDown();

  const addr = order.shippingAddress;
  if (addr) {
    doc.fontSize(11).fillColor("#000").text("Shipping To:");
    doc.fontSize(10).fillColor("#444").text(addr.fullName);
    doc.text(addr.street);
    doc.text(`${addr.city}, ${addr.province} ${addr.postalCode}`);
    doc.text(addr.country);
    doc.text(addr.phone);
  }
  doc.moveDown();

  doc.fontSize(11).fillColor("#000").text("Items:");
  doc.moveDown(0.5);
  order.items.forEach((item) => {
    doc
      .fontSize(10)
      .fillColor("#444")
      .text(
        `${item.nameSnapshot}  ×${item.quantity}  —  $${(Number(item.unitPrice) * item.quantity).toFixed(2)}`
      );
  });

  doc.moveDown();
  doc.fontSize(10).fillColor("#000");
  doc.text(`Subtotal: $${Number(order.subtotal).toFixed(2)}`);
  if (Number(order.discount) > 0) doc.text(`Discount: -$${Number(order.discount).toFixed(2)}`);
  doc.text(`Tax: $${Number(order.tax).toFixed(2)}`);
  doc.text(`Shipping: Free`);
  doc.fontSize(13).text(`Total: $${Number(order.total).toFixed(2)}`, { underline: true });

  doc.moveDown(2);
  doc.fontSize(9).fillColor("#888").text("Thank you for shopping with H&S Watches.", { align: "center" });

  doc.end();
}

module.exports = { generateInvoice };
