/**
 * Cart Domain Types for Veyora
 */

export interface CartItemDto {
  id: string; // Unique cart item identifier
  productId: string;
  variantId?: string;
  sku: string;
  title: string;
  slug: string;
  image?: string;
  price: number; // Server-validated unit price
  compareAtPrice?: number;
  color?: string;
  size?: string;
  quantity: number;
  maxStock: number; // Server-validated current available stock
  isAvailable: boolean;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  estimatedTax: number;
  total: number;
  itemCount: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
}

export interface CartDto {
  id: string;
  userId?: string;
  guestId?: string;
  items: CartItemDto[];
  totals: CartTotals;
  couponCode?: string;
  discountPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartPayload {
  productId: string;
  quantity?: number;
  variantId?: string;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface ApplyCouponPayload {
  code: string;
}

export interface SyncCartItemPayload {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface SyncCartPayload {
  items: SyncCartItemPayload[];
}
