/* eslint-disable @typescript-eslint/no-explicit-any */
import { Job } from "bullmq";
import mongoose, { Schema, Model } from "mongoose";
import { NotificationJobPayload, NotificationDto } from "@veyora/types";
import { logger } from "@veyora/utils";
import { workerSocketEmitter } from "../infrastructure/socket/redis-emitter";

const workerNotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    actionUrl: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    idempotencyKey: { type: String, sparse: true, unique: true },
  },
  { timestamps: true }
);

const WorkerNotificationModel: Model<any> =
  mongoose.models["Notification"] ||
  mongoose.model("Notification", workerNotificationSchema);

export async function processNotificationJob(
  job: Job<NotificationJobPayload>
): Promise<{ success: boolean; notificationId: string }> {
  const startTime = Date.now();
  const payload = job.data;

  logger.info(
    "NOTIFICATION_WORKER",
    `Processing notification job [${job.id}] for user ${payload.userId} (type: ${payload.type})`,
    { jobId: job.id, idempotencyKey: payload.idempotencyKey }
  );

  let doc: any = null;
  // 1. Idempotency Check in MongoDB
  if (payload.idempotencyKey) {
    doc = await WorkerNotificationModel.findOne({ idempotencyKey: payload.idempotencyKey });
  }

  if (!doc) {
    doc = await WorkerNotificationModel.create({
      userId: new mongoose.Types.ObjectId(payload.userId),
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      actionUrl: payload.actionUrl || "",
      isRead: false,
      readAt: null,
      idempotencyKey: payload.idempotencyKey || null,
    });
  }

  const notificationDto: NotificationDto = {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    data: doc.data,
    actionUrl: doc.actionUrl,
    isRead: doc.isRead,
    readAt: doc.readAt ? doc.readAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };

  // 2. Publish Real-time Event to Redis Socket Emitter
  workerSocketEmitter.emitNotification(notificationDto);

  // 3. Update unread count for user
  const unreadCount = await WorkerNotificationModel.countDocuments({
    userId: doc.userId,
    isRead: false,
  });
  workerSocketEmitter.emitUnreadCount(payload.userId, unreadCount);

  const durationMs = Date.now() - startTime;
  logger.info("NOTIFICATION_WORKER", `Notification job [${job.id}] fulfilled in ${durationMs}ms`);

  return { success: true, notificationId: doc._id.toString() };
}
