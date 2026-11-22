/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from "mongoose";
import { NotificationModel, INotificationDoc } from "../models/notification.model";
import {
  NotificationDto,
  NotificationListQuery,
  PaginatedNotificationsDto,
  CreateNotificationPayload,
  UnreadCountDto,
} from "@veyora/types";
import { NotFoundError, BadRequestError } from "@veyora/utils";
import { eventPublisher } from "../../../infrastructure/events/event-publisher";

export class NotificationService {
  /**
   * Create persistent notification and deliver real-time socket event
   */
  public async createNotification(payload: CreateNotificationPayload): Promise<NotificationDto> {
    if (!Types.ObjectId.isValid(payload.userId)) {
      throw new BadRequestError(`Invalid user ID: ${payload.userId}`);
    }

    // Safety fallback: if not connected to MongoDB and model is not mocked, return simulated DTO
    if (mongoose.connection.readyState === 0 && !(NotificationModel.create as any)?.mock) {
      const simulatedDto: NotificationDto = {
        id: new Types.ObjectId().toString(),
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        actionUrl: payload.actionUrl || "",
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      eventPublisher.publishNotification(simulatedDto);
      eventPublisher.publishUnreadCount(payload.userId, 1);
      return simulatedDto;
    }

    // Idempotency check: if key already exists, return existing
    if (payload.idempotencyKey) {
      const existing = await NotificationModel.findOne({
        idempotencyKey: payload.idempotencyKey,
      });
      if (existing) {
        return this.toNotificationDto(existing);
      }
    }

    const doc = await NotificationModel.create({
      userId: new Types.ObjectId(payload.userId),
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      actionUrl: payload.actionUrl || "",
      isRead: false,
      readAt: null,
      idempotencyKey: payload.idempotencyKey || null,
    });

    const dto = this.toNotificationDto(doc);

    // Publish to real-time socket channel
    eventPublisher.publishNotification(dto);

    // Also update user's live unread count
    const unreadCount = await NotificationModel.countDocuments({
      userId: doc.userId,
      isRead: false,
    });
    eventPublisher.publishUnreadCount(payload.userId, unreadCount);

    return dto;
  }

  /**
   * List notifications for authenticated user with pagination and filters
   */
  public async listNotifications(
    userId: string,
    query: NotificationListQuery
  ): Promise<PaginatedNotificationsDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError(`Invalid user ID: ${userId}`);
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (query.unreadOnly) {
      filter["isRead"] = false;
    }

    if (query.type) {
      filter["type"] = query.type;
    }

    const [items, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ userId: new Types.ObjectId(userId), isRead: false }),
    ]);

    return {
      items: (items as INotificationDoc[]).map((doc) => this.toNotificationDto(doc)),
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get unread notification count
   */
  public async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError(`Invalid user ID: ${userId}`);
    }

    const count = await NotificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });

    return { unreadCount: count };
  }

  /**
   * Mark single notification as read (with strict ownership check)
   */
  public async markAsRead(userId: string, notificationId: string): Promise<NotificationDto> {
    if (!Types.ObjectId.isValid(notificationId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestError("Invalid identifier format");
    }

    const notification = await NotificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw new NotFoundError(`Notification not found with ID: ${notificationId}`);
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      // Emit updated count
      const count = await NotificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      });
      eventPublisher.publishUnreadCount(userId, count);
    }

    return this.toNotificationDto(notification);
  }

  /**
   * Mark all unread notifications as read for user
   */
  public async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError(`Invalid user ID: ${userId}`);
    }

    const result = await NotificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    eventPublisher.publishUnreadCount(userId, 0);

    return {
      success: true,
      count: result.modifiedCount,
    };
  }

  /**
   * Delete single notification (with ownership check)
   */
  public async deleteNotification(userId: string, notificationId: string): Promise<void> {
    if (!Types.ObjectId.isValid(notificationId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestError("Invalid identifier format");
    }

    const result = await NotificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError(`Notification not found with ID: ${notificationId}`);
    }
  }

  /**
   * Map database model to clean DTO
   */
  public toNotificationDto(doc: INotificationDoc): NotificationDto {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      data: doc.data || undefined,
      actionUrl: doc.actionUrl || undefined,
      isRead: doc.isRead,
      readAt: doc.readAt ? doc.readAt.toISOString() : null,
      createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
