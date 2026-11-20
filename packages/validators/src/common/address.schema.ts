import { z } from "zod";

/**
 * Common Geographic Address Schema
 */
export const addressSchema = z.object({
  street: z.string().min(1, "Street address is required").trim(),
  apartment: z.string().trim().optional(),
  city: z.string().min(1, "City is required").trim(),
  state: z.string().min(1, "State or province is required").trim(),
  postalCode: z.string().min(1, "Postal or zip code is required").trim(),
  country: z
    .string()
    .min(2, "Country code or name is required")
    .max(56)
    .trim(),
  phone: z.string().trim().optional(),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.input<typeof addressSchema>;
export type AddressData = z.output<typeof addressSchema>;
