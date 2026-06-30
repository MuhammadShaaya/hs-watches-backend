const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding H&S Watches database...");

  // Categories
  const categories = await Promise.all(
    ["Classic", "Sport", "Chronograph", "Smart Luxury", "Limited Edition"].map((name) =>
      prisma.category.upsert({
        where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
      })
    )
  );

  // Brand
  const brand = await prisma.brand.upsert({
    where: { slug: "hs-watches" },
    update: {},
    create: { name: "H&S Watches", slug: "hs-watches" },
  });

  // Admin & manager accounts
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);

  await prisma.user.upsert({
    where: { email: "admin@hswatches.com" },
    update: {},
    create: {
      name: "Shabbir Ahmed Khan",
      email: "admin@hswatches.com",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@hswatches.com" },
    update: {},
    create: {
      name: "Layla Hassan",
      email: "manager@hswatches.com",
      password: managerPassword,
      role: "MANAGER",
      emailVerified: true,
    },
  });

  // Demo customer
  const customerPassword = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "james.whitfield@example.com" },
    update: {},
    create: {
      name: "James Whitfield",
      email: "james.whitfield@example.com",
      password: customerPassword,
      role: "CUSTOMER",
      emailVerified: true,
    },
  });

  // Sample product
  const meridianCategory = categories.find((c) => c.slug === "chronograph");
  await prisma.product.upsert({
    where: { slug: "meridian-automatic-chronograph" },
    update: {},
    create: {
      slug: "meridian-automatic-chronograph",
      sku: "HS-MER-001",
      barcode: "8901234560011",
      name: "Meridian Automatic Chronograph",
      categoryId: meridianCategory.id,
      brandId: brand.id,
      gender: "MEN",
      movement: "AUTOMATIC",
      caseMaterial: "STAINLESS_STEEL",
      caseSize: "42mm",
      price: 4250,
      stock: 14,
      weightGrams: 168,
      dimensions: "42mm x 12.4mm",
      shortDescription: "A masterclass in precision engineering, pairing a column-wheel chronograph with mirror-polished lugs.",
      description: "The Meridian Automatic Chronograph is the result of three years of in-house development...",
      warranty: "5-Year International Warranty",
      status: "ACTIVE",
      featured: true,
      trending: true,
      bestSeller: true,
      tags: ["chronograph", "automatic", "steel", "bestseller"],
      seoTitle: "Meridian Automatic Chronograph | H&S Watches",
      seoDescription: "Discover the Meridian Automatic Chronograph — a hand-finished column-wheel chronograph in 316L steel.",
      seoKeywords: ["luxury chronograph", "automatic watch"],
      images: {
        create: [
          { url: "https://picsum.photos/seed/meridian-1/900/1100", alt: "Meridian front", isMain: true, order: 0 },
          { url: "https://picsum.photos/seed/meridian-2/900/1100", alt: "Meridian side", isMain: false, order: 1 },
        ],
      },
      specifications: {
        create: [
          { label: "Case Material", value: "316L Stainless Steel" },
          { label: "Movement", value: "Automatic, Column-Wheel Chronograph" },
          { label: "Water Resistance", value: "100m / 10 ATM" },
        ],
      },
      strapOptions: { create: [{ label: "Steel Bracelet", priceDelta: 350 }, { label: "Leather" }] },
      colorOptions: { create: [{ label: "Onyx Black", hex: "#0D0D0D" }, { label: "Midnight Blue", hex: "#13294B" }] },
    },
  });

  // Sample coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      expiry: new Date("2026-12-31"),
      usageLimit: 500,
      usedCount: 0,
    },
  });

  // Store settings
  await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      storeName: "H&S Watches",
      tagline: "Time, Refined.",
      contactEmail: "concierge@hswatches.com",
      contactPhone: "+1 (800) 555-0142",
      address: "1 Madison Avenue, Suite 1200, New York, NY 10010",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
