/**
 * Order Domain Types for Veyora
 */

import { AddressDto, CreateAddressPayload } from "./address";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_pending"
  | "refunded";

export interface OrderStatusHistoryItem {
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedBy?: string;
  role?: string;
  reason?: string;
  timestamp: string;
}

export interface OrderTrackingInfo {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

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
  statusHistory: OrderStatusHistoryItem[];
  tracking?: OrderTrackingInfo;
  cancelReason?: string;
  cancelledAt?: string;
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

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  reason?: string;
  tracking?: OrderTrackingInfo;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  notes?: string;
}

export interface CancelOrderPayload {
  reason?: string;
}

export interface AdminOrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedOrdersDto {
  items: OrderDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
