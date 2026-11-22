/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Schema, Types, Model } from "mongoose";

export interface IShippingZoneDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  countries: string[];
  states: string[];
  postalCodes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shippingZoneSchema = new Schema<IShippingZoneDoc>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    countries: [{ type: String, uppercase: true, trim: true }],
    states: [{ type: String, trim: true }],
    postalCodes: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

shippingZoneSchema.index({ countries: 1, isActive: 1 });

export const ShippingZoneModel: Model<IShippingZoneDoc> =
  mongoose.models["ShippingZone"] ||
  mongoose.model<IShippingZoneDoc>("ShippingZone", shippingZoneSchema);
