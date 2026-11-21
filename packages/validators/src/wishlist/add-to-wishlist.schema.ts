import { z } from "zod";

/**
 * Add Item to Wishlist Schema
 */
export const addToWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required").trim(),
});

export type AddToWishlistInput = z.input<typeof addToWishlistSchema>;
export type AddToWishlistData = z.output<typeof addToWishlistSchema>;

export const wishlistParamSchema = z.object({
  productId: z.string().min(1, "Product ID is required").trim(),
});

export type WishlistParamInput = z.infer<typeof wishlistParamSchema>;
