const prisma = require("../config/prisma");
const { z } = require("zod");

const settingsSchema = z.object({
  storeName: z.string().optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  instagramUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  pinterestUrl: z.string().url().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  seoDefaultTitle: z.string().optional(),
  seoDefaultDescription: z.string().optional(),
});

async function getSettings(req, res) {
  let settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.storeSettings.create({ data: { id: "singleton" } });
  }
  const { smtpPassword, ...safe } = settings;
  res.json(safe);
}

async function updateSettings(req, res) {
  const data = settingsSchema.parse(req.body);
  const settings = await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  const { smtpPassword, ...safe } = settings;
  res.json(safe);
}

module.exports = { getSettings, updateSettings };
