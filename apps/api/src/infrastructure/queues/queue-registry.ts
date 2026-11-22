import { Queue, JobsOptions } from "bullmq";
import { QUEUES, DEFAULT_QUEUE_OPTIONS } from "@veyora/config";
import {
  EmailJobPayload,
  NotificationJobPayload,
  OrderJobPayload,
  PaymentJobPayload,
  VeyoraJobData,
} from "@veyora/types";
import { createRedisClient } from "../redis/redis-client";
import { logger } from "../../config/logger";
import { env } from "../../config/env";

export class QueueRegistry {
  private static instance: QueueRegistry;
  private queues: Map<string, Queue> = new Map();
  private sharedRedisClient = createRedisClient();

  private constructor() {
    if (env.NODE_ENV !== "test") {
      this.initQueues();
    }
  }

  public static getInstance(): QueueRegistry {
    if (!QueueRegistry.instance) {
      QueueRegistry.instance = new QueueRegistry();
    }
    return QueueRegistry.instance;
  }

  private initQueues(): void {
    const queueList = [
      QUEUES.EMAIL,
      QUEUES.NOTIFICATIONS,
      QUEUES.ORDERS,
      QUEUES.PAYMENTS,
      QUEUES.SYSTEM,
    ];

    for (const queueName of queueList) {
      this.getQueue(queueName);
    }
  }

  public getQueue<T extends VeyoraJobData = VeyoraJobData>(name: string): Queue<T> {
    let queue = this.queues.get(name);
    if (!queue) {
      queue = new Queue(name, {
        connection: this.sharedRedisClient,
        defaultJobOptions: DEFAULT_QUEUE_OPTIONS,
      });
      this.queues.set(name, queue);
      logger.info({ queue: name }, "BullMQ queue registered and initialized");
    }
    return queue as Queue<T>;
  }

  /**
   * Enqueue Email Job with Idempotency
   */
  public async addEmailJob(payload: EmailJobPayload, opts?: JobsOptions): Promise<string> {
    const queue = this.getQueue<EmailJobPayload>(QUEUES.EMAIL);
    const jobId = payload.idempotencyKey || `email:${payload.type}:${payload.recipient}:${Date.now()}`;
    const job = await queue.add(payload.type, payload, {
      jobId,
      ...DEFAULT_QUEUE_OPTIONS,
      ...opts,
    });
    return job.id!;
  }

  /**
   * Enqueue Notification Job with Idempotency
   */
  public async addNotificationJob(payload: NotificationJobPayload, opts?: JobsOptions): Promise<string> {
    const queue = this.getQueue<NotificationJobPayload>(QUEUES.NOTIFICATIONS);
    const jobId = payload.idempotencyKey || `notification:${payload.userId}:${payload.type}:${Date.now()}`;
    const job = await queue.add(payload.type, payload, {
      jobId,
      ...DEFAULT_QUEUE_OPTIONS,
      ...opts,
    });
    return job.id!;
  }

  /**
   * Enqueue Order Background Job
   */
  public async addOrderJob(payload: OrderJobPayload, opts?: JobsOptions): Promise<string> {
    const queue = this.getQueue<OrderJobPayload>(QUEUES.ORDERS);
    const jobId = payload.idempotencyKey || `order:${payload.orderId}:${payload.type}`;
    const job = await queue.add(payload.type, payload, {
      jobId,
      ...DEFAULT_QUEUE_OPTIONS,
      ...opts,
    });
    return job.id!;
  }

  /**
   * Enqueue Payment Background Job
   */
  public async addPaymentJob(payload: PaymentJobPayload, opts?: JobsOptions): Promise<string> {
    const queue = this.getQueue<PaymentJobPayload>(QUEUES.PAYMENTS);
    const jobId = payload.idempotencyKey || `payment:${payload.paymentId}:${payload.type}`;
    const job = await queue.add(payload.type, payload, {
      jobId,
      ...DEFAULT_QUEUE_OPTIONS,
      ...opts,
    });
    return job.id!;
  }

  /**
   * Graceful close of all queues and shared Redis client
   */
  public async closeAll(): Promise<void> {
    for (const [name, queue] of this.queues.entries()) {
      try {
        await queue.close();
        logger.info({ queue: name }, "Queue closed cleanly");
      } catch (err) {
        logger.error({ queue: name, error: (err as Error).message }, "Error closing queue");
      }
    }
    this.queues.clear();
    try {
      await this.sharedRedisClient.quit();
    } catch {
      // Ignore in shutdown
    }
  }
}

export const queueRegistry = QueueRegistry.getInstance();
