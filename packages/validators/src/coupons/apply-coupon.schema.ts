import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z.string().min(2, "Coupon code is required").max(30).toUpperCase().trim(),
  cartTotal: z.coerce.number().positive("Cart total must be greater than zero"),
});

export type ApplyCouponInput = z.input<typeof applyCouponSchema>;
export type ApplyCouponData = z.output<typeof applyCouponSchema>;
