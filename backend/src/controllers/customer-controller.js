const prisma = require("../config/prisma");

async function listCustomers(req, res) {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      blocked: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(customers.map((c) => ({ ...c, orderCount: c._count.orders })));
}

async function getCustomer(req, res) {
  const customer = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      addresses: true,
      orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  const { password, ...safe } = customer;
  res.json(safe);
}

async function toggleBlockCustomer(req, res) {
  const customer = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { blocked: !customer.blocked },
  });
  res.json({ id: updated.id, blocked: updated.blocked });
}

async function deleteCustomer(req, res) {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { listCustomers, getCustomer, toggleBlockCustomer, deleteCustomer };
