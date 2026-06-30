const prisma = require("../config/prisma");
const { slugify } = require("../utils/generators");
const { z } = require("zod");

const categorySchema = z.object({ name: z.string().min(2), description: z.string().optional() });

async function listCategories(req, res) {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  res.json(categories.map((c) => ({ ...c, productCount: c._count.products })));
}

async function createCategory(req, res) {
  const data = categorySchema.parse(req.body);
  const slug = slugify(data.name);

  const existing = await prisma.category.findFirst({ where: { OR: [{ name: data.name }, { slug }] } });
  if (existing) return res.status(409).json({ error: "A category with this name already exists" });

  const category = await prisma.category.create({ data: { name: data.name, slug, description: data.description } });
  res.status(201).json(category);
}

async function updateCategory(req, res) {
  const data = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { ...data, ...(data.name && { slug: slugify(data.name) }) },
  });
  res.json(category);
}

async function deleteCategory(req, res) {
  const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (productCount > 0) {
    return res.status(409).json({ error: `Cannot delete category — ${productCount} products are still assigned to it` });
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
