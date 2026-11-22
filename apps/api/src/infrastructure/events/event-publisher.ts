import { SOCKET_ROOMS, SOCKET_EVENTS } from "@veyora/config";
import { NotificationDto } from "@veyora/types";
import { socketServer } from "../socket/socket-server";
import { logger } from "../../config/logger";

export class EventPublisher {
  private static instance: EventPublisher;

  public static getInstance(): EventPublisher {
    if (!EventPublisher.instance) {
      EventPublisher.instance = new EventPublisher();
    }
    return EventPublisher.instance;
  }

  /**
   * Emit real-time notification to the target user room
   */
  public publishNotification(notification: NotificationDto): void {
    const io = socketServer.getIO();
    if (!io) return;

    const userRoom = SOCKET_ROOMS.user(notification.userId);
    io.to(userRoom).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.NOTIFICATION_NEW, notification);

    logger.debug(
      { userId: notification.userId, notificationId: notification.id },
      "Published real-time notification to user room"
    );
  }

  /**
   * Emit updated unread count to user
   */
  public publishUnreadCount(userId: string, count: number): void {
    const io = socketServer.getIO();
    if (!io) return;

    const userRoom = SOCKET_ROOMS.user(userId);
    io.to(userRoom).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.NOTIFICATION_UNREAD_COUNT, {
      unreadCount: count,
    });
  }

  /**
   * Emit real-time order update to user and admin operational rooms
   */
  public publishOrderUpdate(
    order: {
      id: string;
      orderNumber: string;
      status: string;
      userId?: string | null;
      total?: number;
    },
    eventType: string = "updated"
  ): void {
    const io = socketServer.getIO();
    if (!io) return;

    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      eventType,
      timestamp: new Date().toISOString(),
    };

    // 1. User Room
    if (order.userId) {
      const userRoom = SOCKET_ROOMS.user(order.userId);
      io.to(userRoom).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ORDER_UPDATED, payload);
    }

    // 2. Admin Operational Room
    if (eventType === "created") {
      io.to(SOCKET_ROOMS.adminOrders).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ADMIN_ORDER_NEW, payload);
    }
    io.to(SOCKET_ROOMS.adminOrders).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.ORDER_UPDATED, payload);

    logger.debug(
      { orderId: order.id, status: order.status },
      "Published order event to socket rooms"
    );
  }

  /**
   * Emit real-time payment update to user and admin rooms
   */
  public publishPaymentUpdate(
    payment: {
      id: string;
      orderId: string;
      status: string;
      amount: number;
      userId?: string | null;
    },
    eventType: string = "updated"
  ): void {
    const io = socketServer.getIO();
    if (!io) return;

    const payload = {
      paymentId: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      eventType,
      timestamp: new Date().toISOString(),
    };

    if (payment.userId) {
      io.to(SOCKET_ROOMS.user(payment.userId)).emit(
        SOCKET_EVENTS.SERVER_TO_CLIENT.PAYMENT_UPDATED,
        payload
      );
    }

    io.to(SOCKET_ROOMS.adminPayments).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.PAYMENT_UPDATED, payload);
  }

  /**
   * Emit real-time shipment dispatch/tracking update
   */
  public publishShipmentUpdate(shipment: {
    id: string;
    trackingNumber: string;
    orderId: string;
    status: string;
    userId?: string | null;
  }): void {
    const io = socketServer.getIO();
    if (!io) return;

    const payload = {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      orderId: shipment.orderId,
      status: shipment.status,
      timestamp: new Date().toISOString(),
    };

    if (shipment.userId) {
      io.to(SOCKET_ROOMS.user(shipment.userId)).emit(
        SOCKET_EVENTS.SERVER_TO_CLIENT.SHIPMENT_UPDATED,
        payload
      );
    }

    io.to(SOCKET_ROOMS.adminOrders).emit(SOCKET_EVENTS.SERVER_TO_CLIENT.SHIPMENT_UPDATED, payload);
  }
}

export const eventPublisher = EventPublisher.getInstance();
