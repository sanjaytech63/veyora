import { z } from "zod";

/**
 * Update Cart Item Quantity Schema
 */
export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().nonnegative("Quantity cannot be negative"),
});

export type UpdateCartItemInput = z.input<typeof updateCartItemSchema>;
export type UpdateCartItemData = z.output<typeof updateCartItemSchema>;

export const cartItemParamSchema = z.object({
  itemId: z.string().min(1, "Item ID is required").trim(),
});

export type CartItemParamInput = z.infer<typeof cartItemParamSchema>;
