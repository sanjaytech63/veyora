import mongoose, { Document, Schema } from "mongoose";
import { InventoryStatus } from "@veyora/types";

export interface IInventory extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productTitle: string;
  variantId?: mongoose.Types.ObjectId | null;
  variantName?: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  status: InventoryStatus;
  trackQuantity: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productTitle: {
      type: String,
      required: true,
      trim: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    variantName: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    onHand: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
      index: true,
    },
    trackQuantity: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for available stock
inventorySchema.virtual("available").get(function () {
  return Math.max(0, this.onHand - this.reserved);
});

// Pre-save lifecycle hook to calculate inventory status
inventorySchema.pre("save", function (next) {
  const available = Math.max(0, this.onHand - this.reserved);
  if (available <= 0) {
    this.status = "out_of_stock";
  } else if (available <= this.lowStockThreshold) {
    this.status = "low_stock";
  } else {
    this.status = "in_stock";
  }
  next();
});

export const Inventory = mongoose.model<IInventory>("Inventory", inventorySchema);
