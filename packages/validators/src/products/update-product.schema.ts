import { z } from "zod";
import { createProductSchema } from "./create-product.schema";

/**
 * Update Product Schema (Partial update with ID parameter)
 */
export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.input<typeof updateProductSchema>;
export type UpdateProductData = z.output<typeof updateProductSchema>;
