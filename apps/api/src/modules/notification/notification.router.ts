import { Router } from "express";
import { notificationController } from "./controllers/notification.controller";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import { notificationListQuerySchema } from "@veyora/validators";

const router = Router();

// All notification routes strictly require authentication
router.use("/notifications", requireAuth);

// 1. List user notifications with pagination
router.get(
  "/notifications",
  validate({ query: notificationListQuerySchema }),
  notificationController.listNotifications.bind(notificationController)
);

// 2. Get unread notification count
router.get(
  "/notifications/unread-count",
  notificationController.getUnreadCount.bind(notificationController)
);

// 3. Get single notification detail (with strict ownership check)
router.get(
  "/notifications/:id",
  notificationController.getNotification.bind(notificationController)
);

// 4. Mark single notification as read
router.patch(
  "/notifications/:id/read",
  notificationController.markAsRead.bind(notificationController)
);

// 5. Mark single notification as unread
router.patch(
  "/notifications/:id/unread",
  notificationController.markAsUnread.bind(notificationController)
);

// 6. Mark all user notifications as read
router.patch(
  "/notifications/read-all",
  notificationController.markAllAsRead.bind(notificationController)
);

// 7. Delete notification
router.delete(
  "/notifications/:id",
  notificationController.deleteNotification.bind(notificationController)
);

export const notificationRouter = router;
