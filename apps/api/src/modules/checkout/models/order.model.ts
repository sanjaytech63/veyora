import mongoose, { Document, Schema, Types } from "mongoose";
import { OrderStatus } from "@veyora/types";

export interface IOrderItem {
  id: string; // Item UUID
  productId: Types.ObjectId;
  variantId?: Types.ObjectId | null;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
  color?: string;
  size?: string;
}

export interface IOrderAddress {
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  userId?: Types.ObjectId | null;
  guestId?: string | null;
  customerEmail: string;
  customerName: string;
  items: IOrderItem[];
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  shippingMethod: "standard" | "express";
  shippingCost: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  status: OrderStatus;
  idempotencyKey?: string | null;
  customerNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    id: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, default: null },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
  },
  { _id: false }
);

const orderAddressSchema = new Schema<IOrderAddress>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    apartment: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
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
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    shippingAddress: {
      type: orderAddressSchema,
      required: true,
    },
    billingAddress: {
      type: orderAddressSchema,
      required: true,
    },
    shippingMethod: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    idempotencyKey: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    customerNote: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerEmail: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
