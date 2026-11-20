import mongoose, { Document, Schema } from "mongoose";
import { StockMovementType } from "@veyora/types";

export interface IStockMovement extends Document {
  _id: mongoose.Types.ObjectId;
  inventoryId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId | null;
  sku: string;
  type: StockMovementType;
  quantity: number;
  previousOnHand: number;
  newOnHand: number;
  previousReserved: number;
  newReserved: number;
  reason: string;
  referenceId?: string;
  note?: string;
  userId?: mongoose.Types.ObjectId | null;
  userName?: string;
  createdAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "restock",
        "adjustment",
        "correction",
        "reservation",
        "reservation_release",
        "reservation_commit",
        "damaged",
        "return",
      ],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousOnHand: {
      type: Number,
      required: true,
    },
    newOnHand: {
      type: Number,
      required: true,
    },
    previousReserved: {
      type: Number,
      required: true,
      default: 0,
    },
    newReserved: {
      type: Number,
      required: true,
      default: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: {
      type: String,
      trim: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const StockMovement = mongoose.model<IStockMovement>("StockMovement", stockMovementSchema);
