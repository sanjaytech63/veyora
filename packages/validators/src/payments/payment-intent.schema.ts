import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required").trim(),
  paymentProvider: z.enum(["stripe", "razorpay", "cod"]).default("razorpay"),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase().default("INR"),
});

export type CreatePaymentIntentInput = z.input<typeof createPaymentIntentSchema>;
export type CreatePaymentIntentData = z.output<typeof createPaymentIntentSchema>;

export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required").trim(),
  provider: z.enum(["razorpay", "stripe", "cod"]).default("razorpay"),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase().default("INR"),
});

export type InitiatePaymentInput = z.input<typeof initiatePaymentSchema>;
export type InitiatePaymentData = z.output<typeof initiatePaymentSchema>;

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required").trim(),
  gatewayOrderId: z.string().min(1, "Gateway order ID is required").trim(),
  gatewayPaymentId: z.string().min(1, "Gateway payment ID is required").trim(),
  gatewaySignature: z.string().min(1, "Gateway signature is required").trim(),
});

export type VerifyPaymentInput = z.input<typeof verifyPaymentSchema>;
export type VerifyPaymentData = z.output<typeof verifyPaymentSchema>;

export const retryPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required").trim(),
});

export type RetryPaymentInput = z.input<typeof retryPaymentSchema>;
export type RetryPaymentData = z.output<typeof retryPaymentSchema>;

export const refundPaymentSchema = z.object({
  orderId: z.string().trim().optional(),
  amount: z.coerce.number().positive("Refund amount must be positive").optional(),
  reason: z.string().max(500).trim().optional(),
});

export type RefundPaymentInput = z.input<typeof refundPaymentSchema>;
export type RefundPaymentData = z.output<typeof refundPaymentSchema>;
