import { Job } from "bullmq";
import { VeyoraJobData, JobExecutionResult } from "@veyora/types";
import { logger } from "@veyora/utils";

export async function processSystemJob(job: Job<VeyoraJobData>): Promise<JobExecutionResult> {
  const startTime = Date.now();
  logger.info("SYSTEM_PROCESSOR", `Processing job ${job.id} (${job.name})`, {
    jobId: job.id,
    name: job.name,
    data: job.data,
  });

  // Example foundation processor logic
  switch (job.data.type) {
    case "system:ping":
      logger.info("SYSTEM_PROCESSOR", `Handled ping from ${job.data.source}`);
      break;

    case "notification:dispatch":
      logger.info(
        "SYSTEM_PROCESSOR",
        `Dispatched notification to ${job.data.recipient} via ${job.data.channel}`
      );
      break;

    default:
      logger.warn(
        "SYSTEM_PROCESSOR",
        `Unknown job type received: ${(job.data as { type: string }).type}`
      );
  }

  const duration = Date.now() - startTime;
  return {
    jobId: job.id ?? "unknown",
    status: "completed",
    executionTimeMs: duration,
    timestamp: new Date().toISOString(),
  };
}
