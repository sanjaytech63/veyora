import { z } from "zod";

/**
 * Product Status Enum
 */
export const productStatusSchema = z.enum(["draft", "active", "archived"]);
export type ProductStatus = z.infer<typeof productStatusSchema>;

/**
 * Product Image Schema
 */
export const productImageSchema = z.object({
  url: z.string().min(1, "Image URL or path is required").trim(),
  alt: z.string().trim().optional(),
  isPrimary: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

export type ProductImageInput = z.infer<typeof productImageSchema>;

/**
 * Product Variant Schema
 */
export const productVariantSchema = z.object({
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  sku: z.string().min(1, "Variant SKU is required").trim().toUpperCase(),
  price: z.coerce.number().positive("Variant price must be greater than 0"),
  stock: z.coerce.number().int().nonnegative("Variant stock cannot be negative").default(0),
  image: z.string().trim().optional(),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;

/**
 * Product Attribute Schema
 */
export const productAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required").trim(),
  value: z.string().min(1, "Attribute value is required").trim(),
});

export type ProductAttributeInput = z.infer<typeof productAttributeSchema>;

/**
 * Product SEO Schema
 */
export const productSeoSchema = z.object({
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  keywords: z.array(z.string().trim()).default([]),
});

export type ProductSeoInput = z.infer<typeof productSeoSchema>;

/**
 * Create Product Schema
 */
export const createProductSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").trim(),
  slug: z
    .string()
    .min(2)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must only contain lowercase alphanumeric characters and hyphens"
    )
    .optional(),
  description: z.string().min(10, "Description must be at least 10 characters").trim(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  compareAtPrice: z.coerce.number().positive("Compare at price must be greater than 0").optional(),
  costPrice: z.coerce.number().nonnegative("Cost price cannot be negative").optional(),
  sku: z.string().min(1, "SKU is required").trim().toUpperCase(),
  barcode: z.string().trim().optional(),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative").default(0),
  trackQuantity: z.boolean().default(true),
  categoryId: z.string().min(1, "Category is required").trim(),
  brandId: z.string().trim().optional(),
  tags: z.array(z.string().trim()).default([]),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  attributes: z.array(productAttributeSchema).default([]),
  seo: productSeoSchema.optional(),
  status: productStatusSchema.default("draft"),
});

export type CreateProductInput = z.input<typeof createProductSchema>;
export type CreateProductData = z.output<typeof createProductSchema>;
