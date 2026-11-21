import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentProvider } from "@veyora/types";

export interface IWebhookEvent extends Document {
  _id: Types.ObjectId;
  eventId: string;
  provider: PaymentProvider;
  eventType: string;
  payload: Record<string, unknown>;
  status: "processed" | "ignored" | "failed";
  error?: string | null;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["razorpay", "stripe"],
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["processed", "ignored", "failed"],
      default: "processed",
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

webhookEventSchema.index({ createdAt: -1 });

export const WebhookEvent = mongoose.model<IWebhookEvent>("WebhookEvent", webhookEventSchema);
