const { z } = require("zod");

const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  isMain: z.boolean().optional(),
  order: z.number().int().optional(),
});

const variantOptionSchema = z.object({
  label: z.string().min(1),
  hex: z.string().optional(),
  priceDelta: z.number().optional(),
});

const specSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const createProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  sku: z.string().min(2).optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  movement: z.enum(["AUTOMATIC", "QUARTZ", "MANUAL_WIND", "SMART"]),
  caseMaterial: z.enum(["STAINLESS_STEEL", "TITANIUM", "ROSE_GOLD", "YELLOW_GOLD", "CERAMIC"]),
  caseSize: z.string().min(1),
  price: z.number().positive(),
  salePrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  weightGrams: z.number().int().positive().optional(),
  dimensions: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  warranty: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT"]).default("DRAFT"),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(productImageSchema).min(1, "At least one product image is required"),
  strapOptions: z.array(variantOptionSchema).optional(),
  colorOptions: z.array(variantOptionSchema).optional(),
  specifications: z.array(specSchema).optional(),
});

const updateProductSchema = createProductSchema.partial();

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

module.exports = { createProductSchema, updateProductSchema, bulkDeleteSchema };
