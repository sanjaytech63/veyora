import { Schema, model, Document } from "mongoose";

export interface ISetting extends Document {
  key: string;
  storeName: string;
  currency: string;
  freeShippingThreshold: number;
  enableExpress: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global_settings",
      index: true,
    },
    storeName: {
      type: String,
      required: true,
      default: "Veyora Fashion Atelier",
    },
    currency: {
      type: String,
      required: true,
      default: "USD ($)",
    },
    freeShippingThreshold: {
      type: Number,
      required: true,
      default: 150,
    },
    enableExpress: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = model<ISetting>("Setting", settingSchema);
