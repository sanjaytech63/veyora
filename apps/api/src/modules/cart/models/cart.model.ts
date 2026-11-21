import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICartItem {
  id: string; // Unique cart item identifier (UUID)
  productId: Types.ObjectId;
  variantId?: Types.ObjectId | null;
  sku: string;
  quantity: number;
  addedPrice: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId | null;
  guestId?: string | null;
  items: ICartItem[];
  couponCode?: string | null;
  discountPercent?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    id: {
      type: String,
      required: true,
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
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    addedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
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
    items: {
      type: [cartItemSchema],
      default: [],
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed cart lookup
cartSchema.index({ userId: 1, updatedAt: -1 });
cartSchema.index({ guestId: 1, updatedAt: -1 });

export const Cart = mongoose.model<ICart>("Cart", cartSchema);
