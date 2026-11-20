import { z } from "zod";

/**
 * Common Identifier Validation Schemas
 */

export const idParamSchema = z.object({
  id: z.string().min(1, "Identifier cannot be empty").trim(),
});

export type IdParamInput = z.infer<typeof idParamSchema>;

export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character hex ObjectId");

export type MongoIdInput = z.infer<typeof mongoIdSchema>;

export const slugSchema = z
  .string()
  .min(1, "Slug cannot be empty")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and hyphens")
  .trim();

export type SlugInput = z.infer<typeof slugSchema>;
