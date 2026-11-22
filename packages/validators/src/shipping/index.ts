import { z } from "zod";

export const calculateShippingSchema = z.object({
  destinationPostalCode: z.string().min(3).max(12),
  destinationCountry: z.string().min(2).max(60).default("IN"),
  destinationState: z.string().max(60).optional(),
  subtotal: z.number().min(0),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        weightGrams: z.number().nonnegative().optional(),
      })
    )
    .optional(),
});

export const shipmentItemSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const createShipmentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  carrier: z.string().max(50).optional().default("delhivery"),
  carrierName: z.string().max(100).optional(),
  shippingMethod: z.string().max(50).optional().default("standard"),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional().or(z.literal("")),
  items: z.array(shipmentItemSchema).optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const shipmentStatusEnum = z.enum([
  "pending",
  "manifested",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed_delivery",
  "returned",
  "cancelled",
]);

export const updateShipmentTrackingSchema = z.object({
  status: shipmentStatusEnum,
  location: z.string().max(150).optional(),
  description: z.string().max(500).optional(),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional().or(z.literal("")),
  carrier: z.string().max(50).optional(),
});

export const shipmentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: shipmentStatusEnum.optional(),
  carrier: z.string().max(50).optional(),
  orderId: z.string().optional(),
  search: z.string().max(100).optional(),
});

export const createShippingZoneSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(50),
  description: z.string().max(300).optional(),
  countries: z.array(z.string().min(2).max(10)).min(1),
  states: z.array(z.string().max(50)).optional().default([]),
  postalCodes: z.array(z.string().max(20)).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const createShippingMethodSchema = z.object({
  zoneId: z.string().optional(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().max(300).default(""),
  carrier: z.string().min(2).max(50).default("delhivery"),
  rate: z.number().min(0),
  freeShippingThreshold: z.number().min(0).nullable().optional(),
  estimatedDaysMin: z.number().int().min(0).default(2),
  estimatedDaysMax: z.number().int().min(1).default(5),
  isActive: z.boolean().optional().default(true),
});
