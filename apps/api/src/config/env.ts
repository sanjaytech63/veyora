import dotenv from "dotenv";
import { apiEnvSchema, ApiEnv } from "@veyora/validators";

dotenv.config();

export const apiConfigSchema = apiEnvSchema;
export type ApiConfig = ApiEnv;

function parseEnv(): ApiConfig {
  const result = apiEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error("FATAL: Invalid API environment configuration:", formattedErrors);
    throw new Error("Invalid API environment configuration. Terminating process.");
  }
  return result.data;
}

export const env = parseEnv();
