import { z } from "zod";
import { passwordSchema } from "./password.schema";
import { emailSchema } from "../common/email.schema";

/**
 * Customer Registration Schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
