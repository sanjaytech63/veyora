import { Schema, model, Document, Types } from "mongoose";
import { CollectionStatus } from "@veyora/types";

export interface ICollection extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  season?: string;
  image?: string;
  status: CollectionStatus;
  productIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    season: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Collection = model<ICollection>("Collection", collectionSchema);
