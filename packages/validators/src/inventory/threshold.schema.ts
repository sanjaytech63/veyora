import { z } from "zod";

export const updateThresholdSchema = z.object({
  lowStockThreshold: z.coerce
    .number()
    .int("Threshold must be an integer")
    .min(0, "Threshold cannot be negative")
    .default(5),
});

export type UpdateThresholdInput = z.infer<typeof updateThresholdSchema>;
