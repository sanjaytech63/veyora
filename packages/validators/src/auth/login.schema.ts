import { z } from "zod";
import { emailSchema } from "../common/email.schema";

/**
 * User & Administrator Login Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
