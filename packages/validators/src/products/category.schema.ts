import { z } from "zod";

/**
 * Category Status Enum
 */
export const categoryStatusSchema = z.enum(["active", "inactive"]);
export type CategoryStatus = z.infer<typeof categoryStatusSchema>;

/**
 * Create Category Schema
 */
export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").trim(),
  slug: z
    .string()
    .min(2)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must only contain lowercase alphanumeric characters and hyphens"
    )
    .optional(),
  description: z.string().trim().optional(),
  parentId: z.string().trim().nullable().optional(),
  image: z.string().trim().optional(),
  status: categoryStatusSchema.default("active"),
  order: z.coerce.number().int().default(0),
});

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type CreateCategoryData = z.output<typeof createCategorySchema>;

/**
 * Update Category Schema
 */
export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;
export type UpdateCategoryData = z.output<typeof updateCategorySchema>;
