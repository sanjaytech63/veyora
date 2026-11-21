/**
 * Order Domain Types for Veyora
 */

import { AddressDto, CreateAddressPayload } from "./address";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItemDto {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
  color?: string;
  size?: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId?: string;
  guestId?: string;
  customerEmail: string;
  customerName: string;
  items: OrderItemDto[];
  shippingAddress: AddressDto;
  billingAddress: AddressDto;
  shippingMethod: "standard" | "express";
  shippingCost: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  idempotencyKey?: string;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  customerEmail: string;
  customerName: string;
  shippingAddress: CreateAddressPayload;
  billingAddress?: CreateAddressPayload;
  sameAsShipping?: boolean;
  shippingMethod: "standard" | "express";
  customerNote?: string;
  idempotencyKey?: string;
}
