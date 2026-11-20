import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { productStatusSchema } from "./create-product.schema";

/**
 * Product Catalog Filtering & Query Schema
 */
export const productQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().optional(),
  status: productStatusSchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z
    .preprocess((val) => {
      if (typeof val === "string") return val.toLowerCase() === "true";
      return val;
    }, z.boolean())
    .optional(),
  tag: z.string().trim().optional(),
});

export type ProductQueryInput = z.input<typeof productQuerySchema>;
export type ProductQueryData = z.output<typeof productQuerySchema>;
