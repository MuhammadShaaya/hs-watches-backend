const prisma = require("../config/prisma");

async function listNotifications(req, res) {
  const where = req.user.role === "CUSTOMER" ? { userId: req.user.id } : {};
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
}

async function markRead(req, res) {
  const notification = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  res.json(notification);
}

async function markAllRead(req, res) {
  const where = req.user.role === "CUSTOMER" ? { userId: req.user.id } : {};
  await prisma.notification.updateMany({ where, data: { read: true } });
  res.json({ success: true });
}

module.exports = { listNotifications, markRead, markAllRead };
