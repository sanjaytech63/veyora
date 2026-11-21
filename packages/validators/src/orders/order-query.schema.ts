import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refund_pending",
  "refunded",
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const paymentStatusSchema = z.enum(["pending", "paid", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const orderQuerySchema = paginationQuerySchema.extend({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  customerId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type OrderQueryInput = z.input<typeof orderQuerySchema>;
export type OrderQueryData = z.output<typeof orderQuerySchema>;
