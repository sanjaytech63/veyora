import { Job } from "bullmq";
import { EmailJobPayload } from "@veyora/types";
import { logger } from "@veyora/utils";

export async function processEmailJob(job: Job<EmailJobPayload>): Promise<{ success: boolean; messageId: string }> {
  const startTime = Date.now();
  const { type, recipient, data, idempotencyKey } = job.data;

  // Safe structured logging - NEVER log OTPs, reset tokens, or secrets
  logger.info("EMAIL_WORKER", `Processing email job [${job.id}] - Type: ${type} for ${recipient}`, {
    jobId: job.id,
    type,
    idempotencyKey,
    attempt: job.attemptsMade + 1,
  });

  // Simulated luxury atelier email templates
  switch (type) {
    case "order-confirmation": {
      const orderNumber = data["orderNumber"] || "N/A";
      const total = data["total"] || 0;
      logger.info("EMAIL_DISPATCH", `Order Confirmation sent to ${recipient} for Order #${orderNumber} (₹${total})`);
      break;
    }
    case "payment-confirmation": {
      const orderNumber = data["orderNumber"] || "N/A";
      const amount = data["amount"] || 0;
      logger.info("EMAIL_DISPATCH", `Payment Receipt sent to ${recipient} for Order #${orderNumber} (₹${amount})`);
      break;
    }
    case "shipping-notification": {
      const trackingNumber = data["trackingNumber"] || "N/A";
      const carrier = data["carrier"] || "Atelier Courier";
      logger.info("EMAIL_DISPATCH", `Shipment Dispatch notice sent to ${recipient} (AWB: ${trackingNumber} via ${carrier})`);
      break;
    }
    case "order-cancellation": {
      const orderNumber = data["orderNumber"] || "N/A";
      logger.info("EMAIL_DISPATCH", `Order Cancellation notice sent to ${recipient} for Order #${orderNumber}`);
      break;
    }
    case "password-reset": {
      // Intentionally omit token from log
      logger.info("EMAIL_DISPATCH", `Password Reset link securely dispatched to ${recipient}`);
      break;
    }
    case "otp": {
      // Intentionally omit OTP value from log
      logger.info("EMAIL_DISPATCH", `One-Time Verification Code securely dispatched to ${recipient}`);
      break;
    }
    default:
      logger.warn("EMAIL_DISPATCH", `Unknown email template type: ${type}`);
  }

  const durationMs = Date.now() - startTime;
  const messageId = `msg_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  logger.info("EMAIL_WORKER", `Email job [${job.id}] completed in ${durationMs}ms with ID ${messageId}`);

  return { success: true, messageId };
}
