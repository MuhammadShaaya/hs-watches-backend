const prisma = require("../config/prisma");

async function getWishlist(req, res) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    include: { product: { include: { images: true } } },
    orderBy: { addedAt: "desc" },
  });
  res.json(items);
}

async function toggleWishlistItem(req, res) {
  const { productId } = req.body;

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return res.json({ wishlisted: false });
  }

  await prisma.wishlistItem.create({ data: { userId: req.user.id, productId } });
  res.json({ wishlisted: true });
}

module.exports = { getWishlist, toggleWishlistItem };
