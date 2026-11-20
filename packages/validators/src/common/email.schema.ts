import { z } from "zod";

/**
 * Common Email Validation Schema
 * Trims and lowercases input before validating email structure
 */
export const emailSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
  z.string().email("Please provide a valid email address")
) as z.ZodEffects<z.ZodString, string, string>;

export type EmailInput = z.infer<typeof emailSchema>;
