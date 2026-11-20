import { z } from "zod";
import { orderStatusSchema } from "./order-query.schema";

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  trackingNumber: z.string().trim().optional(),
  trackingCarrier: z.string().trim().optional(),
  trackingUrl: z.string().url().trim().optional(),
  notes: z.string().trim().optional(),
});

export type UpdateOrderStatusInput = z.input<typeof updateOrderStatusSchema>;
export type UpdateOrderStatusData = z.output<typeof updateOrderStatusSchema>;
