const prisma = require("../config/prisma");
const { addressSchema } = require("../utils/validators-order");

async function listAddresses(req, res) {
  const addresses = await prisma.address.findMany({ where: { userId: req.user.id }, orderBy: { isDefault: "desc" } });
  res.json(addresses);
}

async function createAddress(req, res) {
  const data = addressSchema.parse(req.body);
  const isFirst = (await prisma.address.count({ where: { userId: req.user.id } })) === 0;

  const address = await prisma.address.create({
    data: { ...data, userId: req.user.id, isDefault: isFirst },
  });
  res.status(201).json(address);
}

async function setDefaultAddress(req, res) {
  await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  const address = await prisma.address.update({ where: { id: req.params.id }, data: { isDefault: true } });
  res.json(address);
}

async function deleteAddress(req, res) {
  await prisma.address.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { listAddresses, createAddress, setDefaultAddress, deleteAddress };
