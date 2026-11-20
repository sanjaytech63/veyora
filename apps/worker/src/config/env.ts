import dotenv from "dotenv";
import { workerEnvSchema, WorkerEnv } from "@veyora/validators";
import { logger } from "@veyora/utils";

dotenv.config();

function loadEnv(): WorkerEnv {
  const result = workerEnvSchema.safeParse(process.env);
  if (!result.success) {
    logger.error("WORKER_CONFIG", "Invalid worker environment configuration", {
      errors: result.error.flatten().fieldErrors,
    });
    throw new Error("Invalid Worker environment configuration");
  }
  return result.data;
}

export const env = loadEnv();
