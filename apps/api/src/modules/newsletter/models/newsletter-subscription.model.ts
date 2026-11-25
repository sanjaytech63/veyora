import mongoose, { Document, Model, Schema } from "mongoose";

export type NewsletterSubscriptionStatus = "pending" | "active" | "unsubscribed";

export interface INewsletterSubscription extends Document {
  email: string;
  normalizedEmail: string;
  status: NewsletterSubscriptionStatus;
  consentAt: Date;
  verificationAt?: Date | null;
  unsubscribedAt?: Date | null;
  source: "website";
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSubscriptionSchema = new Schema<INewsletterSubscription>(
  {
    email: { type: String, required: true, trim: true },
    normalizedEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "unsubscribed"],
      default: "pending",
      required: true,
      index: true,
    },
    consentAt: { type: Date, required: true, default: Date.now },
    verificationAt: { type: Date, default: null },
    unsubscribedAt: { type: Date, default: null },
    source: { type: String, enum: ["website"], default: "website", required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret["id"] = ret["_id"]?.toString();
        delete ret["_id"];
        delete ret["__v"];
        delete ret["email"];
        delete ret["normalizedEmail"];
        return ret;
      },
    },
  }
);

newsletterSubscriptionSchema.index({ status: 1, createdAt: -1 });

export const NewsletterSubscriptionModel: Model<INewsletterSubscription> =
  mongoose.models["NewsletterSubscription"] ||
  mongoose.model<INewsletterSubscription>("NewsletterSubscription", newsletterSubscriptionSchema);
