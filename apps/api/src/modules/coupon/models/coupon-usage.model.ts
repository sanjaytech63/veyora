import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICouponUsage extends Document {
  _id: Types.ObjectId;
  couponId: Types.ObjectId;
  couponCode: string;
  orderId?: Types.ObjectId | null;
  orderNumber?: string | null;
  userId?: Types.ObjectId | null;
  customerEmail: string;
  discountAmount: number;
  orderTotal: number;
  status: "applied" | "reverted";
  appliedAt: Date;
  revertedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    couponCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    orderNumber: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["applied", "reverted"],
      default: "applied",
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    revertedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const CouponUsage: mongoose.Model<ICouponUsage> =
  (mongoose.models.CouponUsage as mongoose.Model<ICouponUsage>) ||
  mongoose.model<ICouponUsage>("CouponUsage", couponUsageSchema);
