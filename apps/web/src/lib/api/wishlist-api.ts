import { apiClient } from "./api-client";
import { WishlistDto, AddToWishlistPayload } from "@veyora/types";

export const wishlistApi = {
  getWishlist(): Promise<WishlistDto> {
    return apiClient.get<WishlistDto>("/wishlist");
  },

  addToWishlist(payload: AddToWishlistPayload): Promise<WishlistDto> {
    return apiClient.post<WishlistDto>("/wishlist/items", payload);
  },

  removeFromWishlist(productId: string): Promise<WishlistDto> {
    return apiClient.delete<WishlistDto>(`/wishlist/items/${productId}`);
  },

  clearWishlist(): Promise<WishlistDto> {
    return apiClient.delete<WishlistDto>("/wishlist");
  },
};
