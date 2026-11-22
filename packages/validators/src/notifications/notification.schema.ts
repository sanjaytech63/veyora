import { z } from "zod";

export const notificationTypeEnum = z.enum(["order", "payment", "shipping", "account", "system"]);

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  type: notificationTypeEnum.optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  type: notificationTypeEnum,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.unknown()).optional(),
  actionUrl: z.string().max(500).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1),
});
