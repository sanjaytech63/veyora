import { z } from "zod";
import { addressSchema } from "../common/address.schema";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required").trim(),
  title: z.string().min(1, "Product title is required").trim(),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  variantId: z.string().trim().optional(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: z.enum(["stripe", "razorpay", "cod"]),
  shippingMethodId: z.string().min(1, "Shipping method is required").trim(),
  shippingCost: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  discount: z.coerce.number().nonnegative().default(0),
  couponCode: z.string().trim().optional(),
  customerNote: z.string().max(500).trim().optional(),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;
export type CreateOrderData = z.output<typeof createOrderSchema>;
