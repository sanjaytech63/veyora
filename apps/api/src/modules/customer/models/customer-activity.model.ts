import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICustomerActivity extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  action: string;
  performedBy: string;
  performerRole: string;
  details?: Record<string, unknown>;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const customerActivitySchema = new Schema<ICustomerActivity>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    performedBy: {
      type: String,
      required: true,
      trim: true,
    },
    performerRole: {
      type: String,
      required: true,
      trim: true,
      default: "admin",
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    reason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

customerActivitySchema.index({ customerId: 1, createdAt: -1 });

export const CustomerActivity: mongoose.Model<ICustomerActivity> =
  (mongoose.models.CustomerActivity as mongoose.Model<ICustomerActivity>) ||
  mongoose.model<ICustomerActivity>("CustomerActivity", customerActivitySchema);
