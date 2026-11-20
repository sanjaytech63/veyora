import { z } from "zod";

/**
 * Add Item to Cart Schema
 */
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required").trim(),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1").default(1),
  variantId: z.string().trim().optional(),
});

export type AddToCartInput = z.input<typeof addToCartSchema>;
export type AddToCartData = z.output<typeof addToCartSchema>;
