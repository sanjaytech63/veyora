import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWishlistItem {
  productId: Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId | null;
  guestId?: string | null;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const wishlistSchema = new Schema<IWishlist>(
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
      type: [wishlistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index({ userId: 1, updatedAt: -1 });
wishlistSchema.index({ guestId: 1, updatedAt: -1 });

export const Wishlist = mongoose.model<IWishlist>("Wishlist", wishlistSchema);
