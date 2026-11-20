import { z } from "zod";

/**
 * Admin Portal Environment Schema
 */
export const adminEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be a valid URL").default("http://localhost:4000/api/v1"),
});

export type AdminEnv = z.infer<typeof adminEnvSchema>;
