import { Worker, Job } from "bullmq";
import { QUEUES } from "@veyora/config";
import {
  EmailJobPayload,
  NotificationJobPayload,
  OrderJobPayload,
  PaymentJobPayload,
  VeyoraJobData,
} from "@veyora/types";
import { logger } from "@veyora/utils";
import { env } from "./config/env";
import { redisConnection } from "./queues/connection";
import { closeAllQueues } from "./queues/queue-manager";
import { connectMongo, disconnectMongo } from "./infrastructure/mongodb/mongo-connection";
import { processSystemJob } from "./processors/sample.processor";
import { processEmailJob } from "./processors/email.processor";
import { processNotificationJob } from "./processors/notification.processor";
import { processOrderJob } from "./processors/order.processor";
import { processPaymentJob } from "./processors/payment.processor";

logger.info(
  "WORKER_STARTUP",
  `Starting Veyora Worker Suite in ${env.NODE_ENV} mode (Concurrency: ${env.CONCURRENCY})`
);

// Connect to MongoDB
connectMongo().catch((err) => {
  logger.error("WORKER_STARTUP", "Failed to connect to MongoDB", { error: (err as Error).message });
});

const workers: Worker[] = [];

// 1. Email Worker
const emailWorker = new Worker<EmailJobPayload>(
  QUEUES.EMAIL,
  async (job: Job<EmailJobPayload>) => processEmailJob(job),
  { connection: redisConnection, concurrency: env.CONCURRENCY }
);
workers.push(emailWorker);

// 2. Notification Worker
const notificationWorker = new Worker<NotificationJobPayload>(
  QUEUES.NOTIFICATIONS,
  async (job: Job<NotificationJobPayload>) => processNotificationJob(job),
  { connection: redisConnection, concurrency: env.CONCURRENCY }
);
workers.push(notificationWorker);

// 3. Order Events Worker
const orderWorker = new Worker<OrderJobPayload>(
  QUEUES.ORDERS,
  async (job: Job<OrderJobPayload>) => processOrderJob(job),
  { connection: redisConnection, concurrency: env.CONCURRENCY }
);
workers.push(orderWorker);

// 4. Payment Events Worker
const paymentWorker = new Worker<PaymentJobPayload>(
  QUEUES.PAYMENTS,
  async (job: Job<PaymentJobPayload>) => processPaymentJob(job),
  { connection: redisConnection, concurrency: env.CONCURRENCY }
);
workers.push(paymentWorker);

// 5. System Worker
const systemWorker = new Worker<VeyoraJobData>(
  QUEUES.SYSTEM,
  async (job: Job<VeyoraJobData>) => processSystemJob(job),
  { connection: redisConnection, concurrency: env.CONCURRENCY }
);
workers.push(systemWorker);

// Attach shared logging listeners to each worker
workers.forEach((w) => {
  w.on("completed", (job: Job) => {
    logger.info("WORKER_JOB", `Job [${job.id}] on queue "${w.name}" completed successfully`);
  });

  w.on("failed", (job: Job | undefined, err: Error) => {
    logger.error("WORKER_JOB", `Job [${job?.id ?? "unknown"}] on queue "${w.name}" failed: ${err.message}`, {
      jobId: job?.id,
      queue: w.name,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    });
  });

  w.on("error", (err: Error) => {
    logger.error("WORKER_ERROR", `Worker error on queue "${w.name}"`, { error: err.message });
  });
});

logger.info(
  "WORKER_READY",
  `All 5 BullMQ Workers registered: [${workers.map((w) => w.name).join(", ")}]`
);

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("WORKER_SHUTDOWN", `Received ${signal}. Gracefully stopping all workers...`);

  // Force close after 10 seconds
  const forceTimer = setTimeout(() => {
    logger.error("WORKER_SHUTDOWN", "Shutdown timed out. Terminating process immediately.");
    process.exit(1);
  }, 10000);

  try {
    // 1. Close all workers safely
    await Promise.all(workers.map((w) => w.close()));
    logger.info("WORKER_SHUTDOWN", "All BullMQ workers stopped accepting jobs.");

    // 2. Close any initialized queues
    await closeAllQueues();

    // 3. Close database and Redis connections
    await Promise.all([disconnectMongo(), redisConnection.quit()]);

    clearTimeout(forceTimer);
    logger.info("WORKER_SHUTDOWN", "Worker shutdown completed cleanly.");
    process.exit(0);
  } catch (error) {
    clearTimeout(forceTimer);
    logger.error("WORKER_SHUTDOWN", "Error encountered during graceful shutdown", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
