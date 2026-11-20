import { z } from "zod";

/**
 * Common Pagination & Sorting Query Schema
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().trim().optional(),
});

export type PaginationQueryInput = z.input<typeof paginationQuerySchema>;
export type PaginationQueryData = z.output<typeof paginationQuerySchema>;
