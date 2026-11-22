import { z } from "zod";

export const updateSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required").trim(),
  currency: z.string().min(1, "Currency is required").trim(),
  freeShippingThreshold: z.coerce.number().min(0, "Threshold must be positive"),
  enableExpress: z.boolean(),
});

export type UpdateSettingsInput = z.input<typeof updateSettingsSchema>;
export type UpdateSettingsData = z.output<typeof updateSettingsSchema>;
