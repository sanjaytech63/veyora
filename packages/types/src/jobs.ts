/**
 * Centralized Strongly-Typed BullMQ Job & Queue Definitions for Veyora
 */

import { NotificationType } from "./notification";

export type EmailType =
  | "order-confirmation"
  | "payment-confirmation"
  | "shipping-notification"
  | "password-reset"
  | "otp"
  | "order-cancellation";

export interface EmailJobPayload {
  type: EmailType;
  recipient: string;
  recipientName?: string;
  data: Record<string, unknown>;
  idempotencyKey: string;
  createdAt?: string;
}

export interface NotificationJobPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  channel?: "in-app" | "email" | "both";
  idempotencyKey: string;
  createdAt?: string;
}

export interface OrderJobPayload {
  orderId: string;
  orderNumber: string;
  type: "order:created" | "order:status_updated" | "order:cancelled";
  status: string;
  customerId?: string;
  customerEmail: string;
  customerName?: string;
  data?: Record<string, unknown>;
  idempotencyKey: string;
  createdAt?: string;
}

export interface PaymentJobPayload {
  paymentId: string;
  orderId: string;
  orderNumber?: string;
  type: "payment:verified" | "payment:failed" | "payment:refunded";
  status: string;
  amount: number;
  currency: string;
  customerId?: string;
  customerEmail?: string;
  data?: Record<string, unknown>;
  idempotencyKey: string;
  createdAt?: string;
}

export interface SystemPingJobData {
  type: "system:ping";
  source: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
  createdAt: string;
}

export type VeyoraJobData =
  | EmailJobPayload
  | NotificationJobPayload
  | OrderJobPayload
  | PaymentJobPayload
  | SystemPingJobData;

export interface JobExecutionResult {
  jobId: string;
  queueName: string;
  status: "completed" | "failed";
  executionTimeMs: number;
  timestamp: string;
  result?: unknown;
}
