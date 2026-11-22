import { z } from "zod";

/**
 * Customer Web Storefront Environment Schema
 */
export const webEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  NEXT_PUBLIC_API_URL: z
    .string()
    .url("NEXT_PUBLIC_API_URL must be a valid URL")
    .default("http://localhost:4000/api/v1"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
