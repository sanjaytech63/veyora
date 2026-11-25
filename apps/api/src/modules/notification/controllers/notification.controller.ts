import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { NotificationListQuery, ApiNotificationCode } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  public async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as NotificationListQuery;
      const result = await notificationService.listNotifications(userId, query);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiNotificationCode.NOTIFICATIONS_FETCHED,
        message: "Notifications retrieved successfully.",
        data: result.items,
        meta: {
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1,
          },
          total: result.total,
          unreadCount: result.unreadCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        extra: {
          pagination: {
            total: result.total,
            unreadCount: result.unreadCount,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   */
  public async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await notificationService.getUnreadCount(userId);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiNotificationCode.UNREAD_COUNT_FETCHED,
        message: "Unread count retrieved successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/:id
   */
  public async getNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await notificationService.getNotificationById(userId, id as string);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiNotificationCode.NOTIFICATION_FETCHED,
        message: "Notification retrieved successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await notificationService.markAsRead(userId, id as string);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiNotificationCode.NOTIFICATION_READ,
        message: "Notification marked as read",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/unread
   */
  public async markAsUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await notificationService.markAsUnread(userId, id as string);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiNotificationCode.NOTIFICATION_UNREAD,
        message: "Notification marked as unread",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  public async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await notificationService.markAllAsRead(userId);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiNotificationCode.NOTIFICATIONS_ALL_READ,
        message: "All notifications marked as read",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   */
  public async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await notificationService.deleteNotification(userId, id as string);

      sendSuccess(res, {
        statusCode: 200,
        code: ApiNotificationCode.NOTIFICATION_DELETED,
        message: "Notification deleted successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
