import { Emitter } from "@socket.io/redis-emitter";
import { createRedisConnection } from "../../queues/connection";
import { logger } from "@veyora/utils";
import { SOCKET_ROOMS, SOCKET_EVENTS } from "@veyora/config";
import { NotificationDto } from "@veyora/types";

let emitterInstance: Emitter | null = null;

export function getRedisEmitter(): Emitter {
  if (!emitterInstance) {
    const client = createRedisConnection();
    emitterInstance = new Emitter(client);
    logger.info("WORKER_SOCKET", "Redis Socket.IO Emitter initialized for cross-process events");
  }
  return emitterInstance;
}

export const workerSocketEmitter = {
  emitNotification(notification: NotificationDto): void {
    try {
      const emitter = getRedisEmitter();
      const userRoom = SOCKET_ROOMS.user(notification.userId);
      emitter.to(userRoom).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.NOTIFICATION_NEW, notification);
    } catch (err) {
      logger.error("WORKER_SOCKET", "Failed to emit socket notification via Redis", {
        error: (err as Error).message,
      });
    }
  },

  emitUnreadCount(userId: string, count: number): void {
    try {
      const emitter = getRedisEmitter();
      const userRoom = SOCKET_ROOMS.user(userId);
      emitter.to(userRoom).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.NOTIFICATION_UNREAD_COUNT, {
        unreadCount: count,
      });
    } catch (err) {
      logger.error("WORKER_SOCKET", "Failed to emit unread count via Redis", {
        error: (err as Error).message,
      });
    }
  },

  emitOrderUpdate(payload: { orderId: string; orderNumber: string; status: string; userId?: string | null }): void {
    try {
      const emitter = getRedisEmitter();
      if (payload.userId) {
        emitter.to(SOCKET_ROOMS.user(payload.userId)).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ORDER_UPDATED, payload);
      }
      emitter.to(SOCKET_ROOMS.adminOrders).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ORDER_UPDATED, payload);
    } catch (err) {
      logger.error("WORKER_SOCKET", "Failed to emit order update via Redis", {
        error: (err as Error).message,
      });
    }
  },

  emitPaymentUpdate(payload: { paymentId: string; orderId: string; status: string; amount: number; userId?: string | null }): void {
    try {
      const emitter = getRedisEmitter();
      if (payload.userId) {
        emitter.to(SOCKET_ROOMS.user(payload.userId)).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.PAYMENT_UPDATED, payload);
      }
      emitter.to(SOCKET_ROOMS.adminPayments).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.PAYMENT_UPDATED, payload);
    } catch (err) {
      logger.error("WORKER_SOCKET", "Failed to emit payment update via Redis", {
        error: (err as Error).message,
      });
    }
  },
};
