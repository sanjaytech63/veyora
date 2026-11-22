import { z } from "zod";

export const searchSortEnum = z.enum([
  "relevance",
  "price_asc",
  "price_desc",
  "newest",
  "rating",
  "popular",
]);

export const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  brandId: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z
    .preprocess((val) => {
      if (typeof val === "string") return val.toLowerCase() === "true";
      return val;
    }, z.boolean())
    .optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  tag: z.string().trim().optional(),
  sortBy: searchSortEnum.default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const searchSuggestionQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query is required"),
  limit: z.coerce.number().int().positive().max(20).default(5),
});

export type SearchQueryInput = z.input<typeof searchQuerySchema>;
export type SearchQueryData = z.output<typeof searchQuerySchema>;
export type SearchSuggestionQueryInput = z.input<typeof searchSuggestionQuerySchema>;
export type SearchSuggestionQueryData = z.output<typeof searchSuggestionQuerySchema>;
