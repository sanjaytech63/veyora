import { apiClient } from "./api-client";
import {
  CartDto,
  AddToCartPayload,
  UpdateCartItemPayload,
  ApplyCouponPayload,
  SyncCartPayload,
} from "@veyora/types";

export const cartApi = {
  getCart(): Promise<CartDto> {
    return apiClient.get<CartDto>("/cart");
  },

  addToCart(payload: AddToCartPayload): Promise<CartDto> {
    return apiClient.post<CartDto>("/cart/items", payload);
  },

  updateCartItem(itemId: string, payload: UpdateCartItemPayload): Promise<CartDto> {
    return apiClient.patch<CartDto>(`/cart/items/${itemId}`, payload);
  },

  removeCartItem(itemId: string): Promise<CartDto> {
    return apiClient.delete<CartDto>(`/cart/items/${itemId}`);
  },

  clearCart(): Promise<CartDto> {
    return apiClient.delete<CartDto>("/cart");
  },

  applyCoupon(payload: ApplyCouponPayload): Promise<CartDto> {
    return apiClient.post<CartDto>("/cart/coupon", payload);
  },

  removeCoupon(): Promise<CartDto> {
    return apiClient.delete<CartDto>("/cart/coupon");
  },

  syncCart(payload: SyncCartPayload): Promise<CartDto> {
    return apiClient.post<CartDto>("/cart/sync", payload);
  },
};
