import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentProvider, PaymentStatus, RefundStatus } from "@veyora/types";

export interface IPaymentRefund {
  refundId: string;
  gatewayRefundId: string;
  amount: number;
  reason?: string;
  status: RefundStatus;
  createdAt: Date;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  orderNumber: string;
  userId?: Types.ObjectId | null;
  guestId?: string | null;
  provider: PaymentProvider;
  gatewayOrderId: string;
  gatewayPaymentId?: string | null;
  gatewaySignature?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  attemptCount: number;
  refunds: IPaymentRefund[];
  idempotencyKey?: string | null;
  metadata: Record<string, unknown>;
  error?: {
    code: string;
    description: string;
    timestamp: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentRefundSchema = new Schema<IPaymentRefund>(
  {
    refundId: { type: String, required: true },
    gatewayRefundId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "processed",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guestId: {
      type: String,
      default: null,
      index: true,
    },
    provider: {
      type: String,
      enum: ["razorpay", "stripe", "cod"],
      default: "razorpay",
      required: true,
    },
    gatewayOrderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    gatewaySignature: {
      type: String,
      default: null,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "successful", "failed", "refunded", "partially_refunded"],
      default: "pending",
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    refunds: {
      type: [paymentRefundSchema],
      default: [],
    },
    idempotencyKey: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    error: {
      code: { type: String, default: null },
      description: { type: String, default: null },
      timestamp: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ orderId: 1, status: 1 });

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
