/**
 * Checkout Domain Types for Veyora
 */

import { CartItemDto, CartTotals } from "./cart";

export interface ShippingMethodOption {
  id: "standard" | "express";
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export interface CheckoutValidationDto {
  isValid: boolean;
  items: CartItemDto[];
  totals: CartTotals;
  shippingOptions: ShippingMethodOption[];
  warnings: string[];
}
