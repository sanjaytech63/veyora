import mongoose, { Document, Schema, Types } from "mongoose";
import { DiscountType, CouponStatus } from "@veyora/types";

export interface ICustomerUsageRecord {
  customerIdOrEmail: string;
  usageCount: number;
  lastUsedAt: Date;
}

export interface ICouponAnalytics {
  totalDiscountGiven: number;
  totalRevenueGenerated: number;
  lastUsedAt?: Date | null;
}

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount?: number | null;
  startsAt: Date;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  usageCount: number;
  perCustomerLimit?: number | null;
  customerUsage: ICustomerUsageRecord[];
  applicableProducts: Types.ObjectId[];
  applicableCategories: Types.ObjectId[];
  excludedProducts: Types.ObjectId[];
  isActive: boolean;
  status: CouponStatus;
  analytics: ICouponAnalytics;
  createdAt: Date;
  updatedAt: Date;
}

const customerUsageSchema = new Schema<ICustomerUsageRecord>(
  {
    customerIdOrEmail: { type: String, required: true, trim: true },
    usageCount: { type: Number, required: true, default: 1 },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const couponAnalyticsSchema = new Schema<ICouponAnalytics>(
  {
    totalDiscountGiven: { type: Number, default: 0, min: 0 },
    totalRevenueGenerated: { type: Number, default: 0, min: 0 },
    lastUsedAt: { type: Date, default: null },
  },
  { _id: false }
);

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "fixed_amount"],
      required: true,
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0.01, "Discount value must be positive"],
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    startsAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perCustomerLimit: {
      type: Number,
      default: null,
    },
    customerUsage: {
      type: [customerUsageSchema],
      default: [],
    },
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        default: [],
      },
    ],
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: [],
      },
    ],
    excludedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        default: [],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    analytics: {
      type: couponAnalyticsSchema,
      default: () => ({
        totalDiscountGiven: 0,
        totalRevenueGenerated: 0,
        lastUsedAt: null,
      }),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for dynamic status: "active" | "inactive" | "expired"
couponSchema.virtual("status").get(function (this: ICoupon): CouponStatus {
  if (!this.isActive) return "inactive";
  const now = new Date();
  if (this.expiresAt && new Date(this.expiresAt) < now) return "expired";
  if (this.startsAt && new Date(this.startsAt) > now) return "inactive";
  if (this.usageLimit && this.usageCount >= this.usageLimit) return "expired";
  return "active";
});

export const Coupon: mongoose.Model<ICoupon> =
  (mongoose.models.Coupon as mongoose.Model<ICoupon>) || mongoose.model<ICoupon>("Coupon", couponSchema);
