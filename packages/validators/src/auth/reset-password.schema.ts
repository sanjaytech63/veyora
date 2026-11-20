import { z } from "zod";
import { emailSchema } from "../common/email.schema";
import { passwordSchema } from "./password.schema";

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must only contain digits"),
  newPassword: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
