const { z } = require("zod");

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  street: z.string().min(4),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().default("United States"),
});

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  selectedColor: z.string().optional(),
  selectedStrap: z.string().optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  shippingAddress: addressSchema,
  guestEmail: z.string().email().optional(),
  couponCode: z.string().optional(),
  orderNotes: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]),
});

module.exports = { createOrderSchema, updateOrderStatusSchema, addressSchema };
