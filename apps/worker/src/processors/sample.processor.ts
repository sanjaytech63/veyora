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

  if (job.data.type === "system:ping") {
    logger.info("SYSTEM_PROCESSOR", `Handled ping from ${job.data.source}`);
  } else {
    logger.info("SYSTEM_PROCESSOR", `Handled job type: ${job.data.type}`);
  }

  const duration = Date.now() - startTime;
  return {
    jobId: job.id ?? "unknown",
    queueName: job.queueName || "veyora:system",
    status: "completed",
    executionTimeMs: duration,
    timestamp: new Date().toISOString(),
  };
}
