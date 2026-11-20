import { z } from "zod";

export const stockAdjustmentTypeSchema = z.enum(["increase", "decrease", "correction"]);
export type StockAdjustmentType = z.infer<typeof stockAdjustmentTypeSchema>;

export const adjustStockSchema = z.object({
  sku: z.string().min(1, "SKU is required").trim().toUpperCase(),
  type: stockAdjustmentTypeSchema,
  quantity: z.coerce.number().int("Quantity must be an integer").nonnegative("Quantity cannot be negative"),
  reason: z.string().min(2, "Reason must be at least 2 characters").trim(),
  note: z.string().trim().optional(),
  referenceId: z.string().trim().optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
