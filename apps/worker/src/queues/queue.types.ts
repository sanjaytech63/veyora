import { QUEUES } from "@veyora/config";

export { QUEUES } from "@veyora/config";
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
export type { VeyoraJobData, JobExecutionResult } from "@veyora/types";
