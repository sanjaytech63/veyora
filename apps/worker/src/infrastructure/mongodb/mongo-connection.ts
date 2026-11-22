import mongoose from "mongoose";
import { env } from "../../config/env";
import { logger } from "@veyora/utils";

export async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info("WORKER_DATABASE", "MongoDB connection established in worker process");
  } catch (error) {
    logger.error("WORKER_DATABASE", "MongoDB connection failed in worker", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("WORKER_DATABASE", "MongoDB connection closed in worker");
  }
}
