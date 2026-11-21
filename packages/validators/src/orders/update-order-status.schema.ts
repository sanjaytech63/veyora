import { z } from "zod";
import { orderStatusSchema } from "./order-query.schema";

export const trackingInfoSchema = z.object({
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  trackingUrl: z.string().url("Must be a valid tracking URL").trim().optional(),
  estimatedDeliveryDate: z.string().trim().optional(),
  shippedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  reason: z.string().max(500).trim().optional(),
  tracking: trackingInfoSchema.optional(),
  trackingNumber: z.string().trim().optional(),
  trackingCarrier: z.string().trim().optional(),
  trackingUrl: z.string().url("Must be a valid tracking URL").trim().optional(),
  estimatedDeliveryDate: z.string().trim().optional(),
  notes: z.string().max(500).trim().optional(),
});

export type UpdateOrderStatusInput = z.input<typeof updateOrderStatusSchema>;
export type UpdateOrderStatusData = z.output<typeof updateOrderStatusSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().min(2, "Reason must be at least 2 characters").max(500).trim().optional(),
});

export type CancelOrderInput = z.input<typeof cancelOrderSchema>;
export type CancelOrderData = z.output<typeof cancelOrderSchema>;
