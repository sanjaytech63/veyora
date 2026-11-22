import mongoose, { Document, Schema, Types, Model } from "mongoose";

export interface IShippingMethodDoc extends Document {
  _id: Types.ObjectId;
  zoneId?: Types.ObjectId | null;
  code: string;
  name: string;
  description: string;
  carrier: string;
  rate: number;
  freeShippingThreshold?: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shippingMethodSchema = new Schema<IShippingMethodDoc>(
  {
    zoneId: { type: Schema.Types.ObjectId, ref: "ShippingZone", default: null, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    carrier: { type: String, default: "delhivery", trim: true },
    rate: { type: Number, required: true, min: 0 },
    freeShippingThreshold: { type: Number, default: null },
    estimatedDaysMin: { type: Number, default: 2, min: 0 },
    estimatedDaysMax: { type: Number, default: 5, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

shippingMethodSchema.index({ code: 1, zoneId: 1 });

export const ShippingMethodModel: Model<IShippingMethodDoc> =
  mongoose.models["ShippingMethod"] ||
  mongoose.model<IShippingMethodDoc>("ShippingMethod", shippingMethodSchema);
