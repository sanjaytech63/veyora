import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export const apiConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("*"),
  COOKIE_SECRET: z
    .string()
    .min(16, "COOKIE_SECRET must be at least 16 characters long")
    .default("veyora_secure_cookie_secret_dev_32chars"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  BODY_LIMIT: z.string().default("10mb"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  MONGODB_URI: z
    .string()
    .default("mongodb://root:veyora_mongo_dev@127.0.0.1:27017/veyora_dev?authSource=admin"),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

function parseEnv(): ApiConfig {
  const result = apiConfigSchema.safeParse(process.env);
  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error("FATAL: Invalid API environment configuration:", formattedErrors);
    throw new Error("Invalid API environment configuration. Terminating process.");
  }
  return result.data;
}

export const env = parseEnv();
