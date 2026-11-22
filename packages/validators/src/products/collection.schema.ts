import { z } from "zod";

/**
 * Collection Status Enum
 */
export const collectionStatusSchema = z.enum(["active", "draft", "archived"]);
export type CollectionStatus = z.infer<typeof collectionStatusSchema>;

/**
 * Create Collection Schema
 */
export const createCollectionSchema = z.object({
  name: z.string().min(2, "Collection name must be at least 2 characters").trim(),
  slug: z
    .string()
    .min(2)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must only contain lowercase alphanumeric characters and hyphens"
    )
    .optional(),
  tagline: z.string().trim().optional(),
  description: z.string().trim().optional(),
  season: z.string().trim().optional(),
  image: z.string().trim().optional(),
  status: collectionStatusSchema.default("active"),
  productIds: z.array(z.string()).optional(),
});

export type CreateCollectionInput = z.input<typeof createCollectionSchema>;
export type CreateCollectionData = z.output<typeof createCollectionSchema>;

/**
 * Update Collection Schema
 */
export const updateCollectionSchema = createCollectionSchema.partial();
export type UpdateCollectionInput = z.input<typeof updateCollectionSchema>;
export type UpdateCollectionData = z.output<typeof updateCollectionSchema>;
