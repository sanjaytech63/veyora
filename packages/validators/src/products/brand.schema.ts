import { z } from "zod";

/**
 * Brand Status Enum
 */
export const brandStatusSchema = z.enum(["active", "inactive"]);
export type BrandStatus = z.infer<typeof brandStatusSchema>;

/**
 * Create Brand Schema
 */
export const createBrandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").trim(),
  slug: z
    .string()
    .min(2)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must only contain lowercase alphanumeric characters and hyphens"
    )
    .optional(),
  description: z.string().trim().optional(),
  logo: z.string().trim().optional(),
  website: z.string().url("Website must be a valid URL").trim().or(z.literal("")).optional(),
  status: brandStatusSchema.default("active"),
});

export type CreateBrandInput = z.input<typeof createBrandSchema>;
export type CreateBrandData = z.output<typeof createBrandSchema>;

/**
 * Update Brand Schema
 */
export const updateBrandSchema = createBrandSchema.partial();
export type UpdateBrandInput = z.input<typeof updateBrandSchema>;
export type UpdateBrandData = z.output<typeof updateBrandSchema>;
