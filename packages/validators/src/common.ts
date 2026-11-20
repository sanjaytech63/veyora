import { z } from "zod";

/**
 * Common Reusable Validation Schemas
 */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

export const idParamSchema = z.object({
  id: z.string().min(1, "Identifier cannot be empty"),
});

export type IdParamInput = z.infer<typeof idParamSchema>;
