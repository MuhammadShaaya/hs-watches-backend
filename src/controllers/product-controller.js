const prisma = require("../config/prisma");
const { createProductSchema, updateProductSchema, bulkDeleteSchema } = require("../utils/validators-product");
const { slugify, generateSku } = require("../utils/generators");

const PRODUCT_INCLUDE = {
  images: { orderBy: { order: "asc" } },
  specifications: true,
  strapOptions: true,
  colorOptions: true,
  category: true,
  brand: true,
  reviews: { where: { status: "APPROVED" } },
};

async function listProducts(req, res) {
  const {
    search,
    collection: categorySlug,
    gender,
    movement,
    caseMaterial,
    minPrice,
    maxPrice,
    minRating,
    status,
    featured,
    bestSeller,
    newArrival,
    sale,
    sort = "newest",
    page = "1",
    pageSize = "12",
  } = req.query;

  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: "insensitive" } },
      { tags: { has: String(search).toLowerCase() } },
    ];
  }
  if (categorySlug) where.category = { slug: String(categorySlug) };
  if (gender) where.gender = String(gender).toUpperCase();
  if (movement) where.movement = String(movement).toUpperCase();
  if (caseMaterial) where.caseMaterial = String(caseMaterial).toUpperCase();
  if (status) where.status = String(status).toUpperCase();
  else where.status = "ACTIVE"; // public listings default to active only
  if (featured === "true") where.featured = true;
  if (bestSeller === "true") where.bestSeller = true;
  if (newArrival === "true") where.newArrival = true;
  if (sale === "true") where.salePrice = { not: null };

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" }
      : sort === "price-desc"
      ? { price: "desc" }
      : sort === "newest"
      ? { createdAt: "desc" }
      : { createdAt: "desc" };

  const take = Math.min(Number(pageSize), 50);
  const skip = (Number(page) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, include: PRODUCT_INCLUDE, orderBy, take, skip }),
    prisma.product.count({ where }),
  ]);

  let filtered = items;
  if (minRating) {
    filtered = items.filter((p) => computeAverageRating(p.reviews) >= Number(minRating));
  }

  res.json({
    items: filtered.map(serializeProduct),
    total,
    page: Number(page),
    pageSize: take,
    totalPages: Math.ceil(total / take),
  });
}

async function getProductBySlug(req, res) {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { ...PRODUCT_INCLUDE, reviews: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(serializeProduct(product));
}

async function getProductById(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { ...PRODUCT_INCLUDE, reviews: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(serializeProduct(product));
}

async function createProduct(req, res) {
  const data = createProductSchema.parse(req.body);

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const sku = data.sku || generateSku();

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      sku,
      barcode: data.barcode,
      categoryId: data.categoryId,
      brandId: data.brandId,
      gender: data.gender,
      movement: data.movement,
      caseMaterial: data.caseMaterial,
      caseSize: data.caseSize,
      price: data.price,
      salePrice: data.salePrice,
      stock: data.stock,
      weightGrams: data.weightGrams,
      dimensions: data.dimensions,
      shortDescription: data.shortDescription,
      description: data.description,
      warranty: data.warranty,
      status: data.status,
      featured: data.featured ?? false,
      trending: data.trending ?? false,
      newArrival: data.newArrival ?? false,
      bestSeller: data.bestSeller ?? false,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords ?? [],
      tags: data.tags ?? [],
      images: { create: data.images.map((img, i) => ({ ...img, order: img.order ?? i })) },
      strapOptions: data.strapOptions ? { create: data.strapOptions } : undefined,
      colorOptions: data.colorOptions ? { create: data.colorOptions } : undefined,
      specifications: data.specifications ? { create: data.specifications } : undefined,
    },
    include: PRODUCT_INCLUDE,
  });

  await prisma.inventoryLog.create({
    data: { productId: product.id, change: product.stock, reason: "Initial stock on product creation" },
  });

  res.status(201).json(serializeProduct(product));
}

async function updateProduct(req, res) {
  const data = updateProductSchema.parse(req.body);
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Product not found" });

  if (data.stock !== undefined && data.stock !== existing.stock) {
    await prisma.inventoryLog.create({
      data: { productId: id, change: data.stock - existing.stock, reason: "Manual stock adjustment via admin" },
    });
  }

  // Replace nested image/spec/variant collections wholesale on update for simplicity and consistency
  if (data.images) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
  }
  if (data.specifications) {
    await prisma.productSpecification.deleteMany({ where: { productId: id } });
  }
  if (data.strapOptions) {
    await prisma.productVariantOption.deleteMany({ where: { strapProductId: id } });
  }
  if (data.colorOptions) {
    await prisma.productVariantOption.deleteMany({ where: { colorProductId: id } });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: slugify(data.slug) }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.brandId !== undefined && { brandId: data.brandId }),
      ...(data.gender && { gender: data.gender }),
      ...(data.movement && { movement: data.movement }),
      ...(data.caseMaterial && { caseMaterial: data.caseMaterial }),
      ...(data.caseSize && { caseSize: data.caseSize }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.weightGrams !== undefined && { weightGrams: data.weightGrams }),
      ...(data.dimensions !== undefined && { dimensions: data.dimensions }),
      ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.warranty !== undefined && { warranty: data.warranty }),
      ...(data.status && { status: data.status }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.trending !== undefined && { trending: data.trending }),
      ...(data.newArrival !== undefined && { newArrival: data.newArrival }),
      ...(data.bestSeller !== undefined && { bestSeller: data.bestSeller }),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
      ...(data.seoKeywords && { seoKeywords: data.seoKeywords }),
      ...(data.tags && { tags: data.tags }),
      ...(data.images && { images: { create: data.images.map((img, i) => ({ ...img, order: img.order ?? i })) } }),
      ...(data.specifications && { specifications: { create: data.specifications } }),
      ...(data.strapOptions && { strapOptions: { create: data.strapOptions } }),
      ...(data.colorOptions && { colorOptions: { create: data.colorOptions } }),
    },
    include: PRODUCT_INCLUDE,
  });

  res.json(serializeProduct(product));
}

async function deleteProduct(req, res) {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

async function bulkDeleteProducts(req, res) {
  const { ids } = bulkDeleteSchema.parse(req.body);
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  res.json({ success: true, deletedCount: ids.length });
}

async function bulkExportProducts(req, res) {
  const products = await prisma.product.findMany({ include: PRODUCT_INCLUDE });
  const rows = [
    ["SKU", "Name", "Price", "Sale Price", "Stock", "Status"],
    ...products.map((p) => [p.sku, p.name, p.price, p.salePrice ?? "", p.stock, p.status]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=products-export.csv");
  res.send(csv);
}

function computeAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

function serializeProduct(p) {
  return {
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    rating: Math.round(computeAverageRating(p.reviews) * 10) / 10,
    reviewCount: p.reviews?.length ?? 0,
  };
}

module.exports = {
  listProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkExportProducts,
};
