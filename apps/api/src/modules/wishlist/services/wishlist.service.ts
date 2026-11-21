import mongoose, { Types } from "mongoose";
import { Wishlist, IWishlist } from "../models/wishlist.model";
import { Product, IProduct } from "../../catalog/models/product.model";
import { Category } from "../../catalog/models/category.model";
import { WishlistDto, WishlistItemDto } from "@veyora/types";
import { BadRequestError, NotFoundError } from "@veyora/utils";

export class WishlistService {
  /**
   * Find or create active wishlist for user or guest
   */
  public async getOrCreateWishlist(userId?: string, guestId?: string): Promise<IWishlist> {
    if (!userId && !guestId) {
      throw new BadRequestError("Wishlist identifier (userId or guestId) is required.");
    }

    let wishlist: IWishlist | null = null;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      wishlist = await Wishlist.findOne({ userId: new Types.ObjectId(userId) });
    }

    if (!wishlist && guestId) {
      wishlist = await Wishlist.findOne({ guestId });
    }

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: userId && mongoose.Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
        guestId: guestId || null,
        items: [],
      });
      await wishlist.save();
    } else if (userId && mongoose.Types.ObjectId.isValid(userId) && !wishlist.userId) {
      wishlist.userId = new Types.ObjectId(userId);
      await wishlist.save();
    }

    return wishlist;
  }

  /**
   * Map wishlist document to full WishlistDto
   */
  public async toWishlistDto(wishlist: IWishlist): Promise<WishlistDto> {
    if (!wishlist.items || wishlist.items.length === 0) {
      return {
        id: wishlist._id.toString(),
        userId: wishlist.userId ? wishlist.userId.toString() : undefined,
        guestId: wishlist.guestId || undefined,
        items: [],
        itemCount: 0,
        createdAt: wishlist.createdAt.toISOString(),
        updatedAt: wishlist.updatedAt.toISOString(),
      };
    }

    const productIds = wishlist.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map<string, IProduct>();
    const categoryIds = new Set<string>();

    for (const p of products) {
      productMap.set(p._id.toString(), p);
      if (p.categoryId) {
        categoryIds.add(p.categoryId.toString());
      }
    }

    const categories = await Category.find({ _id: { $in: Array.from(categoryIds) } });
    const categoryMap = new Map<string, string>();
    for (const c of categories) {
      categoryMap.set(c._id.toString(), c.name);
    }

    const itemsDto: WishlistItemDto[] = [];

    for (const item of wishlist.items) {
      const product = productMap.get(item.productId.toString());
      if (!product) continue;

      const categoryName = product.categoryId ? categoryMap.get(product.categoryId.toString()) : undefined;
      const isAvailable = product.status === "active" && product.stock > 0;

      itemsDto.push({
        id: product._id.toString(),
        productId: product._id.toString(),
        title: product.title,
        slug: product.slug,
        image: product.images?.[0]?.url,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        category: categoryName,
        stock: product.stock,
        isAvailable,
        addedAt: item.addedAt.toISOString(),
      });
    }

    return {
      id: wishlist._id.toString(),
      userId: wishlist.userId ? wishlist.userId.toString() : undefined,
      guestId: wishlist.guestId || undefined,
      items: itemsDto,
      itemCount: itemsDto.length,
      createdAt: wishlist.createdAt.toISOString(),
      updatedAt: wishlist.updatedAt.toISOString(),
    };
  }

  /**
   * Get Wishlist
   */
  public async getWishlist(userId?: string, guestId?: string): Promise<WishlistDto> {
    const wishlist = await this.getOrCreateWishlist(userId, guestId);
    return this.toWishlistDto(wishlist);
  }

  /**
   * Add Item to Wishlist
   */
  public async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    productId: string
  ): Promise<WishlistDto> {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new NotFoundError("Product not found with specified identifier.");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    const wishlist = await this.getOrCreateWishlist(userId, guestId);

    // Prevent duplicate additions (idempotent)
    const exists = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );

    if (!exists) {
      wishlist.items.unshift({
        productId: product._id,
        addedAt: new Date(),
      });
      await wishlist.save();
    }

    return this.toWishlistDto(wishlist);
  }

  /**
   * Remove Item from Wishlist
   */
  public async removeItem(
    userId: string | undefined,
    guestId: string | undefined,
    productId: string
  ): Promise<WishlistDto> {
    const wishlist = await this.getOrCreateWishlist(userId, guestId);
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId
    );
    await wishlist.save();
    return this.toWishlistDto(wishlist);
  }

  /**
   * Clear Entire Wishlist
   */
  public async clearWishlist(userId?: string, guestId?: string): Promise<WishlistDto> {
    const wishlist = await this.getOrCreateWishlist(userId, guestId);
    wishlist.items = [];
    await wishlist.save();
    return this.toWishlistDto(wishlist);
  }
}

export const wishlistService = new WishlistService();
