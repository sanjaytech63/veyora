import { z } from "zod";

/**
 * Environment Variables Validation Schemas
 */

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("*"),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),
  MONGODB_URI: z
    .string()
    .default("mongodb://root:veyora_mongo_dev@127.0.0.1:27017/veyora_dev?authSource=admin"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export const workerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),
  CONCURRENCY: z.coerce.number().int().positive().default(5),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000/api/v1"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
