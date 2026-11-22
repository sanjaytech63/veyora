import { Job } from "bullmq";
import { OrderJobPayload } from "@veyora/types";
import { logger } from "@veyora/utils";
import { workerSocketEmitter } from "../infrastructure/socket/redis-emitter";

export async function processOrderJob(job: Job<OrderJobPayload>): Promise<{ success: boolean; processed: boolean }> {
  const { orderId, orderNumber, type, status, customerId } = job.data;

  logger.info("ORDER_WORKER", `Processing background order task [${job.id}] for Order #${orderNumber} (${type})`);

  // Emit real-time order update event via Redis
  workerSocketEmitter.emitOrderUpdate({
    orderId,
    orderNumber,
    status,
    userId: customerId,
  });

  return { success: true, processed: true };
}
