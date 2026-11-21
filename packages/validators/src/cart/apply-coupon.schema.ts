import { z } from "zod";

/**
 * Apply Cart Coupon Code Schema
 */
export const applyCartCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").trim().toUpperCase(),
});

export type ApplyCartCouponInput = z.input<typeof applyCartCouponSchema>;
export type ApplyCartCouponData = z.output<typeof applyCartCouponSchema>;
