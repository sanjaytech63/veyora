import dotenv from "dotenv";
import { apiEnvSchema, ApiEnv } from "@veyora/validators";
import { logger } from "@veyora/utils";

dotenv.config();

function loadEnv(): ApiEnv {
  const result = apiEnvSchema.safeParse(process.env);
  if (!result.success) {
    logger.error("API_CONFIG", "Invalid environment configuration", {
      errors: result.error.flatten().fieldErrors,
    });
    throw new Error("Invalid API environment configuration");
  }
  return result.data;
}

export const env = loadEnv();
