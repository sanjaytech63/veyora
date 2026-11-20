import { Worker, Job } from "bullmq";
import { QUEUES } from "@veyora/config";
import { VeyoraJobData } from "@veyora/types";
import { logger } from "@veyora/utils";
import { env } from "./config/env";
import { redisConnection } from "./queues/connection";
import { closeAllQueues } from "./queues/queue-manager";
import { processSystemJob } from "./processors/sample.processor";

logger.info(
  "WORKER_STARTUP",
  `Starting Veyora Worker in ${env.NODE_ENV} mode with concurrency ${env.CONCURRENCY}`
);

const systemWorker = new Worker<VeyoraJobData>(
  QUEUES.SYSTEM,
  async (job: Job<VeyoraJobData>) => {
    return processSystemJob(job);
  },
  {
    connection: redisConnection,
    concurrency: env.CONCURRENCY,
  }
);

systemWorker.on("completed", (job: Job<VeyoraJobData>) => {
  logger.info("WORKER_JOB", `Job ${job.id} completed successfully`);
});

systemWorker.on("failed", (job: Job<VeyoraJobData> | undefined, err: Error) => {
  logger.error("WORKER_JOB", `Job ${job?.id ?? "unknown"} failed`, { error: err.message });
});

async function shutdown(signal: string): Promise<void> {
  logger.info("WORKER_SHUTDOWN", `Received ${signal}. Shutting down worker...`);
  try {
    await systemWorker.close();
    await closeAllQueues();
    await redisConnection.quit();
    logger.info("WORKER_SHUTDOWN", "Worker shut down gracefully.");
    process.exit(0);
  } catch (error) {
    logger.error("WORKER_SHUTDOWN", "Error during graceful shutdown", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
