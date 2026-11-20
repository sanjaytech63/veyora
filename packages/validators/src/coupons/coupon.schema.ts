import { z } from "zod";

export const discountTypeSchema = z.enum(["percentage", "fixed_amount"]);
export type DiscountType = z.infer<typeof discountTypeSchema>;

export const createCouponSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").max(30).toUpperCase().trim(),
  discountType: discountTypeSchema,
  discountValue: z.coerce.number().positive("Discount value must be greater than zero"),
  minimumOrderAmount: z.coerce.number().nonnegative().default(0),
  maxDiscountAmount: z.coerce.number().positive().optional(),
  startsAt: z.coerce.date().default(() => new Date()),
  expiresAt: z.coerce.date().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export type CreateCouponInput = z.input<typeof createCouponSchema>;
export type CreateCouponData = z.output<typeof createCouponSchema>;
