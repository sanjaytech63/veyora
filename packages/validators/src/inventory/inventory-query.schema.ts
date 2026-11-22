import { z } from "zod";

export const inventoryStatusFilterSchema = z.enum(["all", "in_stock", "low_stock", "out_of_stock"]);

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: inventoryStatusFilterSchema.default("all"),
  lowStockOnly: z
    .preprocess((val) => {
      if (typeof val === "string") return val === "true" || val === "1";
      return Boolean(val);
    }, z.boolean())
    .optional(),
  sortBy: z
    .enum(["sku", "onHand", "reserved", "available", "createdAt", "updatedAt"])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
