import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { NotificationListQuery } from "@veyora/types";

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  public async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as NotificationListQuery;
      const result = await notificationService.listNotifications(userId, query);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          unreadCount: result.unreadCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        meta: {
          total: result.total,
          unreadCount: result.unreadCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
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

      res.status(200).json({
        success: true,
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

      res.status(200).json({
        success: true,
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

      res.status(200).json({
        success: true,
        data: result,
        message: "Notification marked as read",
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

      res.status(200).json({
        success: true,
        data: result,
        message: "Notification marked as unread",
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

      res.status(200).json({
        success: true,
        data: result,
        message: "All notifications marked as read",
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

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
