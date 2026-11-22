import { z } from "zod";

/**
 * Common Geographic Address Schema
 */
export const addressSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  street: z.string().min(1, "Street address is required").trim(),
  apartment: z.string().trim().optional(),
  city: z.string().min(1, "City is required").trim(),
  state: z.string().min(1, "State or province is required").trim(),
  postalCode: z.string().min(1, "Postal or zip code is required").trim(),
  country: z.string().min(2, "Country code or name is required").max(56).trim(),
  phone: z.string().trim().optional(),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.input<typeof addressSchema>;
export type AddressData = z.output<typeof addressSchema>;

export const createAddressSchema = addressSchema.extend({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
});

export type CreateAddressInput = z.input<typeof createAddressSchema>;
export type CreateAddressData = z.output<typeof createAddressSchema>;

export const updateAddressSchema = createAddressSchema.partial();
export type UpdateAddressInput = z.input<typeof updateAddressSchema>;
export type UpdateAddressData = z.output<typeof updateAddressSchema>;

export const addressParamSchema = z.object({
  addressId: z.string().min(1, "Address ID is required").trim(),
});

export type AddressParamInput = z.infer<typeof addressParamSchema>;
