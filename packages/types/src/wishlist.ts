/**
 * Wishlist Domain Types for Veyora
 */

export interface WishlistItemDto {
  id: string; // Product ID
  productId: string;
  title: string;
  slug: string;
  image?: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  stock: number;
  isAvailable: boolean;
  addedAt: string;
}

export interface WishlistDto {
  id: string;
  userId?: string;
  guestId?: string;
  items: WishlistItemDto[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToWishlistPayload {
  productId: string;
}
