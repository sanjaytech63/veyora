import { Schema, model, Document, Types } from "mongoose";
import {
  ProductStatus,
  ProductImage,
  ProductVariant,
  ProductAttribute,
  ProductSeo,
} from "@veyora/types";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  stock: number;
  trackQuantity: boolean;
  status: ProductStatus;
  categoryId: Types.ObjectId;
  brandId?: Types.ObjectId | null;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  seo?: ProductSeo;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const productVariantSchema = new Schema<ProductVariant>(
  {
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    image: { type: String, trim: true },
  },
  { _id: true }
);

const productAttributeSchema = new Schema<ProductAttribute>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSeoSchema = new Schema<ProductSeo>(
  {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    trackQuantity: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
      index: true,
    },
    images: {
      type: [productImageSchema],
      default: [],
    },
    variants: {
      type: [productVariantSchema],
      default: [],
    },
    attributes: {
      type: [productAttributeSchema],
      default: [],
    },
    seo: {
      type: productSeoSchema,
      default: () => ({}),
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for filtering active products by price and creation date
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ brandId: 1, status: 1 });

// Text index for search functionality
productSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

export const Product = model<IProduct>("Product", productSchema);
