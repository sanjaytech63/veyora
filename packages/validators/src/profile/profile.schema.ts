import { z } from "zod";

/**
 * Validates self-service profile update requests
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name cannot be empty")
    .max(50, "First name must be 50 characters or less")
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name cannot be empty")
    .max(50, "Last name must be 50 characters or less")
    .optional(),
  displayName: z
    .string()
    .trim()
    .max(100, "Display name must be 100 characters or less")
    .nullable()
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9\s\-()]{7,20})?$/, "Please enter a valid phone number format")
    .nullable()
    .optional(),
  bio: z.string().trim().max(500, "Bio cannot exceed 500 characters").nullable().optional(),
  dateOfBirth: z
    .string()
    .datetime({ message: "Invalid date format" })
    .nullable()
    .optional()
    .or(z.date().nullable().optional()),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional(),
  preferences: z
    .object({
      language: z.string().min(2).max(10).optional(),
      timezone: z.string().min(2).max(50).optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Validates Cloudinary avatar metadata submission
 */
export const updateAvatarSchema = z.object({
  publicId: z.string().min(1, "Public ID is required").trim().max(300, "Public ID is too long"),
  secureUrl: z
    .string()
    .url("Valid secure URL is required")
    .trim()
    .refine((url) => url.startsWith("https://res.cloudinary.com/"), {
      message: "Avatar URL must originate from secure Cloudinary CDN",
    }),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().trim().min(2).max(10).optional(),
  bytes: z.number().int().positive().optional(),
});

export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
