import { z } from "zod";

/**
 * Webhook Header Validation Schemas
 */
export const stripeWebhookHeaderSchema = z.object({
  "stripe-signature": z.string().min(1, "Stripe signature header is required"),
});

export type StripeWebhookHeaderInput = z.infer<typeof stripeWebhookHeaderSchema>;

export const razorpayWebhookHeaderSchema = z.object({
  "x-razorpay-signature": z.string().min(1, "Razorpay signature header is required"),
});

export type RazorpayWebhookHeaderInput = z.infer<typeof razorpayWebhookHeaderSchema>;
