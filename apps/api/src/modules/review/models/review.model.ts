import mongoose, { Schema, Document, Types, Model } from "mongoose";
import { ReviewStatus } from "@veyora/types";

export interface IReview extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  rejectionReason?: string;
  isVerifiedPurchase: boolean;
  orderId?: Types.ObjectId;
  helpfulCount: number;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One review per customer per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Efficient compound queries for storefront review retrieval
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

// Efficient admin moderation queue listing
reviewSchema.index({ status: 1, createdAt: -1 });

export const Review: Model<IReview> =
  mongoose.models["Review"] || mongoose.model<IReview>("Review", reviewSchema);
