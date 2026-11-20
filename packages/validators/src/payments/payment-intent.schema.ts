import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required").trim(),
  paymentProvider: z.enum(["stripe", "razorpay"]),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase().default("USD"),
});

export type CreatePaymentIntentInput = z.input<typeof createPaymentIntentSchema>;
export type CreatePaymentIntentData = z.output<typeof createPaymentIntentSchema>;
