import { Job } from "bullmq";
import { PaymentJobPayload } from "@veyora/types";
import { logger } from "@veyora/utils";
import { workerSocketEmitter } from "../infrastructure/socket/redis-emitter";

export async function processPaymentJob(job: Job<PaymentJobPayload>): Promise<{ success: boolean; verified: boolean }> {
  const { paymentId, orderId, status, amount, customerId } = job.data;

  logger.info("PAYMENT_WORKER", `Processing background payment task [${job.id}] (${status} ₹${amount})`);

  // Emit real-time payment status update event via Redis
  workerSocketEmitter.emitPaymentUpdate({
    paymentId,
    orderId,
    status,
    amount,
    userId: customerId,
  });

  return { success: true, verified: true };
}
