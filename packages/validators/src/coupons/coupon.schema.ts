import { z } from "zod";

export const discountTypeSchema = z.enum(["percentage", "fixed", "fixed_amount"]);
export type DiscountType = z.infer<typeof discountTypeSchema>;

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(30, "Code cannot exceed 30 characters")
    .toUpperCase()
    .trim(),
  description: z.string().max(250).trim().optional(),
  discountType: z.enum(["percentage", "fixed", "fixed_amount"]).default("percentage"),
  discountValue: z.coerce.number().positive("Discount value must be greater than zero"),
  minimumOrderAmount: z.coerce
    .number()
    .nonnegative("Minimum order amount cannot be negative")
    .default(0),
  maxDiscountAmount: z.coerce
    .number()
    .positive("Maximum discount must be positive")
    .nullable()
    .optional(),
  startsAt: z.coerce.date().default(() => new Date()),
  expiresAt: z.coerce.date().nullable().optional(),
  usageLimit: z.coerce
    .number()
    .int()
    .positive("Usage limit must be at least 1")
    .nullable()
    .optional(),
  perCustomerLimit: z.coerce
    .number()
    .int()
    .positive("Per-customer limit must be at least 1")
    .nullable()
    .optional(),
  applicableProducts: z.array(z.string().trim()).default([]),
  applicableCategories: z.array(z.string().trim()).default([]),
  excludedProducts: z.array(z.string().trim()).default([]),
  isActive: z.boolean().default(true),
});

export type CreateCouponInput = z.input<typeof createCouponSchema>;
export type CreateCouponData = z.output<typeof createCouponSchema>;

export const updateCouponSchema = createCouponSchema
  .partial()
  .omit({ code: true })
  .extend({
    code: z
      .string()
      .min(2, "Code must be at least 2 characters")
      .max(30, "Code cannot exceed 30 characters")
      .toUpperCase()
      .trim()
      .optional(),
  });

export type UpdateCouponInput = z.input<typeof updateCouponSchema>;
export type UpdateCouponData = z.output<typeof updateCouponSchema>;

export const validateCouponItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  categoryId: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().positive(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase().trim(),
  cartTotal: z.coerce.number().nonnegative().optional(),
  items: z.array(validateCouponItemSchema).optional(),
});

export type ValidateCouponInput = z.input<typeof validateCouponSchema>;
export type ValidateCouponData = z.output<typeof validateCouponSchema>;

export const couponListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["all", "active", "inactive", "expired"]).default("all"),
  sortBy: z.enum(["code", "createdAt", "usageCount", "discountValue"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CouponListQueryInput = z.input<typeof couponListQuerySchema>;
export type CouponListQueryData = z.output<typeof couponListQuerySchema>;
