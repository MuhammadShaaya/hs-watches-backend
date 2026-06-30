const prisma = require("../config/prisma");

async function getDashboardStats(req, res) {
  const [totalRevenueAgg, totalOrders, totalCustomers, activeProducts, lowStockProducts] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.findMany({ where: { stock: { lte: 5 } }, select: { id: true, name: true, stock: true } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  res.json({
    totalRevenue: Number(totalRevenueAgg._sum.total ?? 0),
    totalOrders,
    totalCustomers,
    activeProducts,
    lowStockProducts,
    recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
  });
}

async function getRevenueReport(req, res) {
  // Group orders by month for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: sixMonthsAgo }, status: { not: "CANCELLED" } },
    select: { total: true, createdAt: true },
  });

  const byMonth = {};
  for (const order of orders) {
    const key = order.createdAt.toLocaleString("en-US", { month: "short" });
    byMonth[key] = (byMonth[key] || 0) + Number(order.total);
  }

  res.json(Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue })));
}

async function getTopProducts(req, res) {
  const items = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  res.json(
    items.map((i) => ({
      product: productMap.get(i.productId),
      unitsSold: i._sum.quantity,
    }))
  );
}

module.exports = { getDashboardStats, getRevenueReport, getTopProducts };
