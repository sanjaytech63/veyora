import { z } from "zod";
import { emailSchema } from "../common/email.schema";

/**
 * OTP Verification and Resend Schemas
 */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must only contain digits"),
  type: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]).default("EMAIL_VERIFICATION"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  email: emailSchema,
  type: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]).default("EMAIL_VERIFICATION"),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
