import mongoose, { Document, Schema, Types, Model } from "mongoose";
import { NotificationType } from "@veyora/types";

export interface INotificationDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date | null;
  idempotencyKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["order", "payment", "shipping", "account", "system"],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, default: {} },
    actionUrl: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    idempotencyKey: { type: String, sparse: true, unique: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret["id"] = ret["_id"]?.toString();
        ret["userId"] = ret["userId"]?.toString();
        delete ret["_id"];
        delete ret["__v"];
        return ret;
      },
    },
  }
);

// Compound indexes for high-speed retrieval of user notification feeds
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel: Model<INotificationDoc> =
  mongoose.models["Notification"] ||
  mongoose.model<INotificationDoc>("Notification", notificationSchema);
