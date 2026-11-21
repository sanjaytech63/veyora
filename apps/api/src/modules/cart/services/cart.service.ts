/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import mongoose, { Types } from "mongoose";
import { Cart, ICart, ICartItem } from "../models/cart.model";
import { Product, IProduct } from "../../catalog/models/product.model";
import { Inventory } from "../../inventory/models/inventory.model";
import { Coupon } from "../../coupon/models/coupon.model";
import { couponService } from "../../coupon/services/coupon.service";
import {
  CartDto,
  CartItemDto,
  CartTotals,
  SyncCartItemPayload,
} from "@veyora/types";
import { AddToCartInput } from "@veyora/validators";
import { BadRequestError, ConflictError, NotFoundError } from "@veyora/utils";

const FREE_SHIPPING_THRESHOLD = 150;
const STANDARD_SHIPPING_FEE = 15;
const ESTIMATED_TAX_RATE = 0.08;

const ACTIVE_COUPONS: Record<string, number> = {
  ATELIER10: 10,
  VEYORA10: 10,
  HAUTE15: 15,
  FESTIVE20: 20,
};

export class CartService {
  /**
   * Find or create active cart for user or guest
   */
  public async getOrCreateCart(userId?: string, guestId?: string): Promise<ICart> {
    if (!userId && !guestId) {
      throw new BadRequestError("Cart identifier (userId or guestId) is required.");
    }

    let cart: ICart | null = null;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    }

    if (!cart && guestId) {
      cart = await Cart.findOne({ guestId });
    }

    if (!cart) {
      cart = new Cart({
        userId: userId && mongoose.Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
        guestId: guestId || null,
        items: [],
      });
      await cart.save();
    } else if (userId && mongoose.Types.ObjectId.isValid(userId) && !cart.userId) {
      // Associate guest cart with user on login
      cart.userId = new Types.ObjectId(userId);
      await cart.save();
    }

    return cart;
  }

  /**
   * Map cart document to full server-validated CartDto
   */
  public async toCartDto(cart: ICart): Promise<CartDto> {
    if (!cart.items || cart.items.length === 0) {
      const emptyTotals: CartTotals = {
        subtotal: 0,
        discount: 0,
        shipping: 0,
        estimatedTax: 0,
        total: 0,
        itemCount: 0,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountToFreeShipping: FREE_SHIPPING_THRESHOLD,
      };

      return {
        id: cart._id.toString(),
        userId: cart.userId ? cart.userId.toString() : undefined,
        guestId: cart.guestId || undefined,
        items: [],
        totals: emptyTotals,
        couponCode: cart.couponCode || undefined,
        discountPercent: cart.discountPercent || undefined,
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString(),
      };
    }

    // Batch fetch products for all items
    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map<string, IProduct>();
    for (const p of products) {
      productMap.set(p._id.toString(), p);
    }

    // Batch fetch inventory records
    const inventoryRecords = await Inventory.find({ productId: { $in: productIds } });
    const inventoryMap = new Map<string, number>();
    for (const inv of inventoryRecords) {
      const key = `${inv.productId.toString()}-${inv.variantId ? inv.variantId.toString() : "base"}`;
      const available = Math.max(0, inv.onHand - inv.reserved);
      inventoryMap.set(key, available);
    }

    const itemsDto: CartItemDto[] = [];
    let subtotal = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      const product = productMap.get(item.productId.toString());
      if (!product || product.status !== "active") {
        itemsDto.push({
          id: item.id,
          productId: item.productId.toString(),
          variantId: item.variantId ? item.variantId.toString() : undefined,
          sku: item.sku,
          title: product ? product.title : "Unavailable Garment",
          slug: product ? product.slug : "",
          image: product?.images?.[0]?.url,
          price: item.addedPrice || 0,
          quantity: item.quantity,
          maxStock: 0,
          isAvailable: false,
        });
        continue;
      }

      // Check variant if applicable
      let variant = null;
      if (item.variantId) {
        variant = product.variants.find(
          (v) => (v as any)._id?.toString() === item.variantId?.toString() || v.sku === item.sku
        );
      }

      // Determine live server-side unit price
      const livePrice = variant ? variant.price : product.price;

      // Determine live available stock
      let availableStock = 0;
      if (product.trackQuantity) {
        const invKey = `${product._id.toString()}-${variant && (variant as any)._id ? (variant as any)._id.toString() : "base"}`;
        if (inventoryMap.has(invKey)) {
          availableStock = inventoryMap.get(invKey)!;
        } else {
          availableStock = variant ? variant.stock : product.stock;
        }
      } else {
        availableStock = 999;
      }

      const isAvailable = availableStock > 0 && item.quantity <= availableStock;

      const itemDto: CartItemDto = {
        id: item.id,
        productId: product._id.toString(),
        variantId: item.variantId ? item.variantId.toString() : undefined,
        sku: item.sku || (variant ? variant.sku : product.sku),
        title: product.title,
        slug: product.slug,
        image: variant?.image || product.images?.[0]?.url,
        price: livePrice,
        compareAtPrice: product.compareAtPrice,
        color: variant?.color,
        size: variant?.size,
        quantity: item.quantity,
        maxStock: availableStock,
        isAvailable,
      };

      itemsDto.push(itemDto);
      subtotal += livePrice * item.quantity;
      itemCount += item.quantity;
    }

    // Totals calculation
    const discountPercent = cart.discountPercent || 0;
    const discount = discountPercent > 0 ? Math.round(((subtotal * discountPercent) / 100) * 100) / 100 : 0;
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shipping =
      discountedSubtotal >= FREE_SHIPPING_THRESHOLD || discountedSubtotal === 0
        ? 0
        : STANDARD_SHIPPING_FEE;
    const estimatedTax = Math.round(discountedSubtotal * ESTIMATED_TAX_RATE * 100) / 100;
    const total = Math.round((discountedSubtotal + shipping + estimatedTax) * 100) / 100;
    const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);

    const totals: CartTotals = {
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      shipping,
      estimatedTax,
      total,
      itemCount,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountToFreeShipping: Math.round(amountToFreeShipping * 100) / 100,
    };

    return {
      id: cart._id.toString(),
      userId: cart.userId ? cart.userId.toString() : undefined,
      guestId: cart.guestId || undefined,
      items: itemsDto,
      totals,
      couponCode: cart.couponCode || undefined,
      discountPercent: cart.discountPercent || undefined,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
    };
  }

  /**
   * Get Cart
   */
  public async getCart(userId?: string, guestId?: string): Promise<CartDto> {
    const cart = await this.getOrCreateCart(userId, guestId);
    return this.toCartDto(cart);
  }

  /**
   * Add Item to Cart with rigorous server validation
   */
  public async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    input: AddToCartInput
  ): Promise<CartDto> {
    const { productId, quantity = 1, variantId } = input;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new NotFoundError("Product not found with specified identifier.");
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== "active") {
      throw new NotFoundError("Product not found or currently unavailable.");
    }

    let targetVariant = null;
    if (variantId) {
      targetVariant = product.variants.find(
        (v) => (v as any)._id?.toString() === variantId.trim() || v.sku === variantId.trim()
      );
      if (!targetVariant) {
        throw new BadRequestError("Selected garment variant does not exist.");
      }
    }

    const sku = targetVariant ? targetVariant.sku : product.sku;
    const unitPrice = targetVariant ? targetVariant.price : product.price;

    // Validate available stock
    let availableStock = 0;
    if (product.trackQuantity) {
      const invQuery: Record<string, any> = { productId: product._id };
      if (targetVariant && (targetVariant as any)._id) {
        invQuery.variantId = (targetVariant as any)._id;
      } else {
        invQuery.variantId = null;
      }
      const inv = await Inventory.findOne(invQuery);
      if (inv) {
        availableStock = Math.max(0, inv.onHand - inv.reserved);
      } else {
        availableStock = targetVariant ? targetVariant.stock : product.stock;
      }
    } else {
      availableStock = 999;
    }

    const cart = await this.getOrCreateCart(userId, guestId);

    // Check if this product & variant is already in cart
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (item.variantId ? item.variantId.toString() : undefined) ===
          (targetVariant && (targetVariant as any)._id ? (targetVariant as any)._id.toString() : undefined)
    );

    const currentQtyInCart = existingIndex > -1 ? cart.items[existingIndex]!.quantity : 0;
    const requestedTotalQty = currentQtyInCart + quantity;

    if (product.trackQuantity && requestedTotalQty > availableStock) {
      if (availableStock <= 0) {
        throw new ConflictError("Selected garment is currently out of stock.");
      }
      throw new ConflictError(
        `Requested quantity exceeds available stock. Only ${availableStock} unit(s) available (${currentQtyInCart} already in your bag).`
      );
    }

    if (existingIndex > -1) {
      cart.items[existingIndex]!.quantity = requestedTotalQty;
      cart.items[existingIndex]!.addedPrice = unitPrice;
    } else {
      const newItem: ICartItem = {
        id: randomUUID(),
        productId: product._id,
        variantId: targetVariant && (targetVariant as any)._id ? (targetVariant as any)._id : null,
        sku,
        quantity,
        addedPrice: unitPrice,
      };
      cart.items.push(newItem);
    }

    await cart.save();
    return this.toCartDto(cart);
  }

  /**
   * Update Cart Item Quantity
   */
  public async updateItemQuantity(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
    quantity: number
  ): Promise<CartDto> {
    const cart = await this.getOrCreateCart(userId, guestId);

    const itemIndex = cart.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) {
      throw new NotFoundError("Cart item not found.");
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
      return this.toCartDto(cart);
    }

    const item = cart.items[itemIndex]!;
    const product = await Product.findById(item.productId);
    if (!product || product.status !== "active") {
      throw new NotFoundError("Product is no longer available.");
    }

    let availableStock = 0;
    if (product.trackQuantity) {
      const invQuery: Record<string, any> = { productId: product._id };
      if (item.variantId) {
        invQuery.variantId = item.variantId;
      } else {
        invQuery.variantId = null;
      }
      const inv = await Inventory.findOne(invQuery);
      if (inv) {
        availableStock = Math.max(0, inv.onHand - inv.reserved);
      } else {
        if (item.variantId) {
          const v = product.variants.find((vr) => (vr as any)._id?.toString() === item.variantId?.toString());
          availableStock = v ? v.stock : 0;
        } else {
          availableStock = product.stock;
        }
      }

      if (quantity > availableStock) {
        throw new ConflictError(
          `Requested quantity (${quantity}) exceeds available stock (${availableStock} units available).`
        );
      }
    }

    item.quantity = quantity;
    await cart.save();
    return this.toCartDto(cart);
  }

  /**
   * Remove Item from Cart
   */
  public async removeItem(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string
  ): Promise<CartDto> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    await cart.save();
    return this.toCartDto(cart);
  }

  /**
   * Clear Cart
   */
  public async clearCart(userId?: string, guestId?: string): Promise<CartDto> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = [];
    cart.couponCode = null;
    cart.discountPercent = 0;
    await cart.save();
    return this.toCartDto(cart);
  }

  /**
   * Apply Coupon Code
   */
  public async applyCoupon(
    userId: string | undefined,
    guestId: string | undefined,
    code: string
  ): Promise<CartDto> {
    const cleanCode = code.trim().toUpperCase();

    // Check dynamic database coupon if database is connected
    if (mongoose.connection.readyState === 1) {
      const dbCoupon = await Coupon.findOne({ code: cleanCode });
      if (dbCoupon) {
        const cart = await this.getOrCreateCart(userId, guestId);
        const items = cart.items.map((i) => ({
          productId: i.productId.toString(),
          price: i.addedPrice || 0,
          quantity: i.quantity,
        }));

        let subtotal = 0;
        for (const item of items) {
          subtotal += item.price * item.quantity;
        }

        try {
          const validation = await couponService.validateAndCalculateDiscount(
            cleanCode,
            subtotal,
            items,
            userId ? { userId } : undefined
          );

          if (!validation.isValid) {
            throw new BadRequestError(validation.message || "Invalid or ineligible promotional code.");
          }

          cart.couponCode = cleanCode;
          if (dbCoupon.discountType === "percentage") {
            cart.discountPercent = dbCoupon.discountValue;
          } else {
            const eligSubtotal = validation.eligibleSubtotal || subtotal;
            cart.discountPercent =
              eligSubtotal > 0 ? Math.round((validation.discountAmount / eligSubtotal) * 100) : 0;
          }
          await cart.save();
          return this.toCartDto(cart);
        } catch (err: any) {
          throw new BadRequestError(err.message || "Invalid or ineligible promotional code.");
        }
      }
    }

    // Fallback to static coupons for mock/test compatibility
    const discountPercent = ACTIVE_COUPONS[cleanCode];

    if (!discountPercent) {
      throw new BadRequestError("Invalid or expired coupon code.");
    }

    const cart = await this.getOrCreateCart(userId, guestId);
    cart.couponCode = cleanCode;
    cart.discountPercent = discountPercent;
    await cart.save();
    return this.toCartDto(cart);
  }

  /**
   * Remove Coupon
   */
  public async removeCoupon(userId?: string, guestId?: string): Promise<CartDto> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.couponCode = null;
    cart.discountPercent = 0;
    await cart.save();
    return this.toCartDto(cart);
  }

  /**
   * Synchronize / Bulk Validate Client Items with Server Database
   */
  public async syncCart(
    userId: string | undefined,
    guestId: string | undefined,
    items: SyncCartItemPayload[]
  ): Promise<CartDto> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = [];

    for (const input of items) {
      if (!mongoose.Types.ObjectId.isValid(input.productId)) continue;
      const product = await Product.findById(input.productId);
      if (!product || product.status !== "active") continue;

      let variant = null;
      if (input.variantId) {
        variant = product.variants.find(
          (v) => (v as any)._id?.toString() === input.variantId || v.sku === input.variantId
        );
      }

      // Check available stock
      let available = 0;
      if (product.trackQuantity) {
        const inv = await Inventory.findOne({
          productId: product._id,
          variantId: variant && (variant as any)._id ? (variant as any)._id : null,
        });
        available = inv ? Math.max(0, inv.onHand - inv.reserved) : (variant ? variant.stock : product.stock);
      } else {
        available = 999;
      }

      const clampedQty = Math.min(input.quantity, Math.max(1, available));
      if (available > 0) {
        cart.items.push({
          id: randomUUID(),
          productId: product._id,
          variantId: variant && (variant as any)._id ? (variant as any)._id : null,
          sku: variant ? variant.sku : product.sku,
          quantity: clampedQty,
          addedPrice: variant ? variant.price : product.price,
        });
      }
    }

    await cart.save();
    return this.toCartDto(cart);
  }
}

export const cartService = new CartService();
