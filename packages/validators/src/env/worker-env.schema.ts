import { z } from "zod";

/**
 * Background Worker Environment Schema
 */
export const workerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_TLS: z.coerce.boolean().optional().default(false),
  CONCURRENCY: z.coerce.number().int().positive().default(5),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/veyora_dev"),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
