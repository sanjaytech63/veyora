import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QueueName } from "./queue.types";
import { logger } from "@veyora/utils";

const queues = new Map<QueueName, Queue>();

export function getQueue(queueName: QueueName): Queue {
  let queue = queues.get(queueName);
  if (!queue) {
    queue = new Queue(queueName, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
    queues.set(queueName, queue);
    logger.info("QUEUE_MANAGER", `Initialized queue: ${queueName}`);
  }
  return queue;
}

export async function closeAllQueues(): Promise<void> {
  for (const [name, queue] of queues.entries()) {
    logger.info("QUEUE_MANAGER", `Closing queue: ${name}`);
    await queue.close();
  }
}
