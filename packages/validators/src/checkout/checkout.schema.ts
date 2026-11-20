import { z } from "zod";
import { addressSchema } from "../common/address.schema";

/**
 * Checkout Item Schema
 */
export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required").trim(),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  variantId: z.string().trim().optional(),
});

export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;

/**
 * Checkout Session Initialization Schema
 */
export const checkoutSessionSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "At least one item is required for checkout"),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsShipping: z.boolean().default(true),
  shippingMethodId: z.string().min(1, "Shipping method is required").trim(),
  couponCode: z.string().trim().optional(),
  customerNote: z.string().max(500, "Notes cannot exceed 500 characters").trim().optional(),
});

export type CheckoutSessionInput = z.input<typeof checkoutSessionSchema>;
export type CheckoutSessionData = z.output<typeof checkoutSessionSchema>;
