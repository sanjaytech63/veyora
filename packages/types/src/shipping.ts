/**
 * Veyora Shipping & Order Fulfillment Domain Types
 */

import { AddressDto } from "./address";

export type ShippingMethodType =
  | "standard"
  | "express"
  | "overnight"
  | "white_glove"
  | "custom";

export type CarrierType =
  | "delhivery"
  | "shiprocket"
  | "bluedart"
  | "fedex"
  | "dhl"
  | "custom";

export type ShipmentStatus =
  | "pending"
  | "manifested"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery"
  | "returned"
  | "cancelled";

export interface ShippingZoneDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  countries: string[];
  states: string[];
  postalCodes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethodDto {
  id: string;
  zoneId?: string;
  code: ShippingMethodType | string;
  name: string;
  description: string;
  carrier: CarrierType | string;
  rate: number;
  freeShippingThreshold?: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingRateQuote {
  methodId: string;
  code: string;
  name: string;
  description: string;
  carrier: string;
  amount: number;
  originalAmount: number;
  isFree: boolean;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  estimatedDeliveryDate: string;
}

export interface CalculateShippingPayload {
  destinationPostalCode: string;
  destinationCountry?: string;
  destinationState?: string;
  subtotal: number;
  items?: Array<{
    productId: string;
    quantity: number;
    weightGrams?: number;
  }>;
}

export interface CalculateShippingResult {
  zoneName: string;
  zoneCode: string;
  quotes: ShippingRateQuote[];
}

export interface ShipmentItemDto {
  orderItemId: string;
  productId: string;
  variantId?: string;
  title: string;
  sku: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface TrackingEventDto {
  id: string;
  status: ShipmentStatus;
  location?: string;
  description: string;
  timestamp: string;
}

export interface ShipmentDto {
  id: string;
  shipmentNumber: string;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: CarrierType | string;
  carrierName: string;
  shippingMethod: string;
  status: ShipmentStatus;
  items: ShipmentItemDto[];
  shippingAddress: AddressDto;
  trackingUrl?: string;
  labelUrl?: string;
  trackingEvents: TrackingEventDto[];
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDeliveryAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentPayload {
  orderId: string;
  carrier?: CarrierType | string;
  carrierName?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items?: Array<{
    orderItemId: string;
    quantity: number;
  }>;
  estimatedDeliveryAt?: string;
  notes?: string;
}

export interface UpdateShipmentTrackingPayload {
  status: ShipmentStatus;
  location?: string;
  description?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

export interface CreateShippingZonePayload {
  name: string;
  code: string;
  description?: string;
  countries: string[];
  states?: string[];
  postalCodes?: string[];
  isActive?: boolean;
}

export interface CreateShippingMethodPayload {
  zoneId?: string;
  code: ShippingMethodType | string;
  name: string;
  description: string;
  carrier: CarrierType | string;
  rate: number;
  freeShippingThreshold?: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive?: boolean;
}

export interface ShipmentListQuery {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  carrier?: string;
  orderId?: string;
  search?: string;
}
