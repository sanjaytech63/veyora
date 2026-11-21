import { z } from "zod";

/**
 * Sync Cart Item Schema
 */
export const syncCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required").trim(),
  variantId: z.string().trim().optional(),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1").default(1),
});

export const syncCartSchema = z.object({
  items: z.array(syncCartItemSchema).default([]),
});

export type SyncCartInput = z.input<typeof syncCartSchema>;
export type SyncCartData = z.output<typeof syncCartSchema>;
