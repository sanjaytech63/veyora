/**
 * Job and Queue types for Veyora worker execution
 */

export type QueueName = "veyora-system" | "veyora-notifications" | "veyora-events";

export interface BaseJobData {
  correlationId: string;
  createdAt: string;
}

export interface SystemPingJobData extends BaseJobData {
  type: "system:ping";
  source: string;
  payload?: Record<string, unknown>;
}

export interface NotificationJobData extends BaseJobData {
  type: "notification:dispatch";
  recipient: string;
  channel: "email" | "sms" | "webhook";
  subject?: string;
  content: string;
}

export type VeyoraJobData = SystemPingJobData | NotificationJobData;

export interface JobExecutionResult {
  jobId: string;
  status: "completed" | "failed";
  executionTimeMs: number;
  timestamp: string;
  result?: unknown;
}
