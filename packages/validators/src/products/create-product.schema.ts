import { z } from "zod";

/**
 * Product Status Enum
 */
export const productStatusSchema = z.enum(["draft", "active", "archived"]);
export type ProductStatus = z.infer<typeof productStatusSchema>;

/**
 * Create Product Schema
 */
export const createProductSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").trim(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and hyphens")
    .optional(),
  description: z.string().min(10, "Description must be at least 10 characters").trim(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  compareAtPrice: z.coerce.number().positive("Compare at price must be greater than 0").optional(),
  costPrice: z.coerce.number().nonnegative("Cost price cannot be negative").optional(),
  sku: z.string().min(1, "SKU is required").trim().toUpperCase(),
  barcode: z.string().trim().optional(),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative").default(0),
  trackQuantity: z.boolean().default(true),
  category: z.string().min(1, "Category is required").trim(),
  tags: z.array(z.string().trim()).default([]),
  images: z.array(z.string().url("Image must be a valid URL")).default([]),
  status: productStatusSchema.default("draft"),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type CreateProductInput = z.input<typeof createProductSchema>;
export type CreateProductData = z.output<typeof createProductSchema>;
