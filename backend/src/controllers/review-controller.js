const prisma = require("../config/prisma");
const { z } = require("zod");

const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(5),
});

async function listReviews(req, res) {
  const { status, productId } = req.query;
  const where = {};
  if (status) where.status = String(status).toUpperCase();
  if (productId) where.productId = String(productId);

  const reviews = await prisma.review.findMany({
    where,
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(reviews);
}

async function createReview(req, res) {
  const data = createReviewSchema.parse(req.body);

  const review = await prisma.review.create({
    data: {
      productId: data.productId,
      userId: req.user.id,
      customerName: req.user.name,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      verifiedPurchase: await hasVerifiedPurchase(req.user.id, data.productId),
      status: "PENDING",
    },
  });

  await prisma.notification.create({
    data: { message: `New review pending approval on a product`, type: "REVIEW" },
  });

  res.status(201).json(review);
}

async function hasVerifiedPurchase(userId, productId) {
  const order = await prisma.order.findFirst({
    where: { userId, status: "DELIVERED", items: { some: { productId } } },
  });
  return !!order;
}

async function updateReviewStatus(req, res) {
  const { status } = z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) }).parse(req.body);
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
  res.json(review);
}

async function deleteReview(req, res) {
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

async function markHelpful(req, res) {
  const review = await prisma.review.update({
    where: { id: req.params.id },
    data: { helpfulCount: { increment: 1 } },
  });
  res.json(review);
}

module.exports = { listReviews, createReview, updateReviewStatus, deleteReview, markHelpful };
