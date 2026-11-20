import { z } from "zod";

export const reserveStockSchema = z.object({
  sku: z.string().min(1, "SKU is required").trim().toUpperCase(),
  quantity: z.coerce.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  referenceId: z.string().min(1, "Reference ID (e.g. order or cart reference) is required").trim(),
});

export type ReserveStockInput = z.infer<typeof reserveStockSchema>;

export const releaseReservationSchema = z.object({
  sku: z.string().min(1, "SKU is required").trim().toUpperCase(),
  quantity: z.coerce.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  referenceId: z.string().min(1, "Reference ID is required").trim(),
});

export type ReleaseReservationInput = z.infer<typeof releaseReservationSchema>;

export const commitReservationSchema = z.object({
  sku: z.string().min(1, "SKU is required").trim().toUpperCase(),
  quantity: z.coerce.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  referenceId: z.string().min(1, "Reference ID is required").trim(),
});

export type CommitReservationInput = z.infer<typeof commitReservationSchema>;
