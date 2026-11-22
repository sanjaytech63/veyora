/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Schema, Types, Model } from "mongoose";
import { ShipmentStatus, CarrierType } from "@veyora/types";

export interface IShipmentItem {
  orderItemId: string;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId | null;
  title: string;
  sku: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface ITrackingEvent {
  id: string;
  status: ShipmentStatus;
  location?: string;
  description: string;
  timestamp: Date;
}

export interface IShipmentDoc extends Document {
  _id: Types.ObjectId;
  shipmentNumber: string;
  orderId: Types.ObjectId;
  orderNumber: string;
  trackingNumber: string;
  carrier: CarrierType | string;
  carrierName: string;
  shippingMethod: string;
  status: ShipmentStatus;
  items: IShipmentItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  trackingUrl?: string;
  labelUrl?: string;
  trackingEvents: ITrackingEvent[];
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  estimatedDeliveryAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentItemSchema = new Schema<IShipmentItem>(
  {
    orderItemId: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, default: null },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const trackingEventSchema = new Schema<ITrackingEvent>(
  {
    id: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "manifested",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
        "returned",
        "cancelled",
      ],
    },
    location: { type: String, default: "" },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentAddressSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    street: { type: String, required: true },
    apartment: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

const shipmentSchema = new Schema<IShipmentDoc>(
  {
    shipmentNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    trackingNumber: { type: String, required: true, unique: true, index: true },
    carrier: { type: String, required: true, default: "delhivery" },
    carrierName: { type: String, required: true, default: "Delhivery Express" },
    shippingMethod: { type: String, required: true, default: "standard" },
    status: {
      type: String,
      required: true,
      default: "manifested",
      enum: [
        "pending",
        "manifested",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
        "returned",
        "cancelled",
      ],
      index: true,
    },
    items: [shipmentItemSchema],
    shippingAddress: { type: shipmentAddressSchema, required: true },
    trackingUrl: { type: String, default: "" },
    labelUrl: { type: String, default: "" },
    trackingEvents: [trackingEventSchema],
    shippedAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date, default: null },
    estimatedDeliveryAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        ret.orderId = ret.orderId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

shipmentSchema.index({ orderId: 1, createdAt: -1 });
shipmentSchema.index({ carrier: 1, status: 1 });

export const ShipmentModel: Model<IShipmentDoc> =
  mongoose.models["Shipment"] ||
  mongoose.model<IShipmentDoc>("Shipment", shipmentSchema);
