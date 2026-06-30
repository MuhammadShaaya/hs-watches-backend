const prisma = require("../config/prisma");
const { slugify } = require("../utils/generators");
const { z } = require("zod");

const brandSchema = z.object({ name: z.string().min(2), logo: z.string().url().optional() });

async function listBrands(req, res) {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  res.json(brands.map((b) => ({ ...b, productCount: b._count.products })));
}

async function createBrand(req, res) {
  const data = brandSchema.parse(req.body);
  const slug = slugify(data.name);
  const brand = await prisma.brand.create({ data: { name: data.name, slug, logo: data.logo } });
  res.status(201).json(brand);
}

async function updateBrand(req, res) {
  const data = brandSchema.partial().parse(req.body);
  const brand = await prisma.brand.update({
    where: { id: req.params.id },
    data: { ...data, ...(data.name && { slug: slugify(data.name) }) },
  });
  res.json(brand);
}

async function deleteBrand(req, res) {
  await prisma.brand.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { listBrands, createBrand, updateBrand, deleteBrand };
