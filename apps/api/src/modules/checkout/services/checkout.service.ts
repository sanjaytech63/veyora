/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import mongoose, { Types } from "mongoose";
import { Address, IAddress } from "../models/address.model";
import { Order, IOrder, IOrderItem } from "../models/order.model";
import { cartService } from "../../cart/services/cart.service";
import { Product, IProduct } from "../../catalog/models/product.model";
import { Inventory } from "../../inventory/models/inventory.model";
import { StockMovement } from "../../inventory/models/stock-movement.model";
import {
  AddressDto,
  CreateAddressPayload,
  UpdateAddressPayload,
  OrderDto,
  CheckoutValidationDto,
  ShippingMethodOption,
} from "@veyora/types";
import { CreateOrderCheckoutInput } from "@veyora/validators";
import { BadRequestError, ConflictError, NotFoundError } from "@veyora/utils";

const FREE_SHIPPING_THRESHOLD = 150;
const STANDARD_SHIPPING_FEE = 15;
const EXPRESS_SHIPPING_FEE = 25;
const ESTIMATED_TAX_RATE = 0.08;

export class CheckoutService {
  private toAddressDto(doc: IAddress): AddressDto {
    return {
      id: doc._id.toString(),
      userId: doc.userId ? doc.userId.toString() : undefined,
      guestId: doc.guestId || undefined,
      firstName: doc.firstName,
      lastName: doc.lastName,
      street: doc.street,
      apartment: doc.apartment,
      city: doc.city,
      state: doc.state,
      postalCode: doc.postalCode,
      country: doc.country,
      phone: doc.phone,
      isDefault: doc.isDefault,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }

  private toOrderDto(doc: IOrder): OrderDto {
    return {
      id: doc._id.toString(),
      orderNumber: doc.orderNumber,
      userId: doc.userId ? doc.userId.toString() : undefined,
      guestId: doc.guestId || undefined,
      customerEmail: doc.customerEmail,
      customerName: doc.customerName,
      items: doc.items.map((i) => ({
        id: i.id,
        productId: i.productId.toString(),
        variantId: i.variantId ? i.variantId.toString() : undefined,
        title: i.title,
        sku: i.sku,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
        image: i.image,
        color: i.color,
        size: i.size,
      })),
      shippingAddress: {
        id: "shipping",
        firstName: doc.shippingAddress.firstName,
        lastName: doc.shippingAddress.lastName,
        street: doc.shippingAddress.street,
        apartment: doc.shippingAddress.apartment,
        city: doc.shippingAddress.city,
        state: doc.shippingAddress.state,
        postalCode: doc.shippingAddress.postalCode,
        country: doc.shippingAddress.country,
        phone: doc.shippingAddress.phone,
        isDefault: false,
      },
      billingAddress: {
        id: "billing",
        firstName: doc.billingAddress.firstName,
        lastName: doc.billingAddress.lastName,
        street: doc.billingAddress.street,
        apartment: doc.billingAddress.apartment,
        city: doc.billingAddress.city,
        state: doc.billingAddress.state,
        postalCode: doc.billingAddress.postalCode,
        country: doc.billingAddress.country,
        phone: doc.billingAddress.phone,
        isDefault: false,
      },
      shippingMethod: doc.shippingMethod,
      shippingCost: doc.shippingCost,
      subtotal: doc.subtotal,
      discount: doc.discount,
      tax: doc.tax,
      total: doc.total,
      couponCode: doc.couponCode || undefined,
      status: doc.status,
      idempotencyKey: doc.idempotencyKey || undefined,
      customerNote: doc.customerNote || undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  // ==========================================
  // 1. ADDRESS MANAGEMENT
  // ==========================================

  public async listAddresses(userId?: string, guestId?: string): Promise<AddressDto[]> {
    const query: Record<string, any> = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new Types.ObjectId(userId);
    } else if (guestId) {
      query.guestId = guestId;
    } else {
      return [];
    }

    const addresses = await Address.find(query).sort({ isDefault: -1, createdAt: -1 });
    return addresses.map((a) => this.toAddressDto(a));
  }

  public async createAddress(
    userId: string | undefined,
    guestId: string | undefined,
    payload: CreateAddressPayload
  ): Promise<AddressDto> {
    if (!userId && !guestId) {
      throw new BadRequestError("User identification or guest session is required to save an address.");
    }

    // If marked as default, unmark any previous default addresses
    if (payload.isDefault) {
      const filter: Record<string, any> = {};
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filter.userId = new Types.ObjectId(userId);
      } else {
        filter.guestId = guestId;
      }
      await Address.updateMany(filter, { $set: { isDefault: false } });
    }

    const address = new Address({
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
      guestId: guestId || null,
      firstName: payload.firstName,
      lastName: payload.lastName,
      street: payload.street,
      apartment: payload.apartment || "",
      city: payload.city,
      state: payload.state,
      postalCode: payload.postalCode,
      country: payload.country || "India",
      phone: payload.phone || "",
      isDefault: payload.isDefault ?? false,
    });

    await address.save();
    return this.toAddressDto(address);
  }

  public async updateAddress(
    userId: string | undefined,
    guestId: string | undefined,
    addressId: string,
    payload: UpdateAddressPayload
  ): Promise<AddressDto> {
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new NotFoundError("Address not found.");
    }

    const address = await Address.findById(addressId);
    if (!address) {
      throw new NotFoundError("Address not found.");
    }

    // Authorization check
    if (userId && address.userId && address.userId.toString() !== userId) {
      throw new BadRequestError("You are not authorized to update this address.");
    } else if (!userId && guestId && address.guestId !== guestId) {
      throw new BadRequestError("You are not authorized to update this address.");
    }

    if (payload.isDefault && !address.isDefault) {
      const filter: Record<string, any> = {};
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filter.userId = new Types.ObjectId(userId);
      } else {
        filter.guestId = guestId;
      }
      await Address.updateMany(filter, { $set: { isDefault: false } });
    }

    Object.assign(address, payload);
    await address.save();
    return this.toAddressDto(address);
  }

  public async deleteAddress(
    userId: string | undefined,
    guestId: string | undefined,
    addressId: string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new NotFoundError("Address not found.");
    }

    const address = await Address.findById(addressId);
    if (!address) {
      throw new NotFoundError("Address not found.");
    }

    if (userId && address.userId && address.userId.toString() !== userId) {
      throw new BadRequestError("You are not authorized to delete this address.");
    } else if (!userId && guestId && address.guestId !== guestId) {
      throw new BadRequestError("You are not authorized to delete this address.");
    }

    await Address.deleteOne({ _id: address._id });
  }

  public async setDefaultAddress(
    userId: string | undefined,
    guestId: string | undefined,
    addressId: string
  ): Promise<AddressDto> {
    return this.updateAddress(userId, guestId, addressId, { isDefault: true });
  }

  // ==========================================
  // 2. CHECKOUT SUMMARY & VALIDATION
  // ==========================================

  public async validateCheckout(
    userId?: string,
    guestId?: string,
    shippingMethod: "standard" | "express" = "standard"
  ): Promise<CheckoutValidationDto> {
    const cart = await cartService.getCart(userId, guestId);
    const warnings: string[] = [];

    let isValid = cart.items.length > 0;

    for (const item of cart.items) {
      if (!item.isAvailable) {
        isValid = false;
        warnings.push(`${item.title} is currently out of stock or unavailable.`);
      } else if (item.maxStock !== undefined && item.quantity > item.maxStock) {
        isValid = false;
        warnings.push(
          `${item.title} requested quantity (${item.quantity}) exceeds available stock (${item.maxStock}).`
        );
      }
    }

    // Shipping options foundation
    const discountedSubtotal = Math.max(0, cart.totals.subtotal - cart.totals.discount);
    const standardCost = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;

    const shippingOptions: ShippingMethodOption[] = [
      {
        id: "standard",
        name: "Standard Insured Dispatch",
        description:
          discountedSubtotal >= FREE_SHIPPING_THRESHOLD
            ? "Complimentary express courier service"
            : "Direct courier service with tracking",
        price: standardCost,
        estimatedDays: "3-5 business days",
      },
      {
        id: "express",
        name: "White Glove Priority Courier",
        description: "Priority handling with climate-controlled guaranteed express delivery",
        price: EXPRESS_SHIPPING_FEE,
        estimatedDays: "1-2 business days",
      },
    ];

    // Recalculate totals according to chosen shipping method
    const activeShippingCost = shippingMethod === "express" ? EXPRESS_SHIPPING_FEE : standardCost;
    const tax = Math.round(discountedSubtotal * ESTIMATED_TAX_RATE * 100) / 100;
    const total = Math.round((discountedSubtotal + activeShippingCost + tax) * 100) / 100;

    const adjustedTotals = {
      ...cart.totals,
      shipping: activeShippingCost,
      estimatedTax: tax,
      total,
    };

    return {
      isValid,
      items: cart.items,
      totals: adjustedTotals,
      shippingOptions,
      warnings,
    };
  }

  // ==========================================
  // 3. ORDER CREATION (CHECKOUT EXECUTION)
  // ==========================================

  public async createOrder(
    userId: string | undefined,
    guestId: string | undefined,
    input: CreateOrderCheckoutInput
  ): Promise<OrderDto> {
    // 1. Idempotency Check: prevent duplicate orders if client retries or double-submits
    if (input.idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey: input.idempotencyKey.trim() });
      if (existingOrder) {
        return this.toOrderDto(existingOrder);
      }
    }

    // 2. Cart verification: cannot checkout an empty cart
    const cartDoc = await cartService.getOrCreateCart(userId, guestId);
    if (!cartDoc.items || cartDoc.items.length === 0) {
      throw new BadRequestError("Cannot place order with an empty shopping bag.");
    }

    // 3. Batch fetch products and inventory to strictly validate on backend
    const productIds = cartDoc.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map<string, IProduct>();
    for (const p of products) {
      productMap.set(p._id.toString(), p);
    }

    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of cartDoc.items) {
      const product = productMap.get(item.productId.toString());
      if (!product || product.status !== "active") {
        throw new BadRequestError(`Product "${item.sku}" is no longer available.`);
      }

      let variant = null;
      if (item.variantId) {
        variant = product.variants.find(
          (v) => (v as any)._id?.toString() === item.variantId?.toString() || v.sku === item.sku
        );
        if (!variant) {
          throw new BadRequestError(`Garment variant "${item.sku}" is no longer available.`);
        }
      }

      // Live server unit price
      const livePrice = variant ? variant.price : product.price;

      // Available stock verification
      let availableStock = 0;
      let inventoryDoc: any = null;

      if (product.trackQuantity) {
        const invQuery: Record<string, any> = { productId: product._id };
        if (item.variantId) {
          invQuery.variantId = item.variantId;
        } else {
          invQuery.variantId = null;
        }

        inventoryDoc = await Inventory.findOne(invQuery);
        if (inventoryDoc) {
          availableStock = Math.max(0, inventoryDoc.onHand - inventoryDoc.reserved);
        } else {
          availableStock = variant ? variant.stock : product.stock;
        }

        if (item.quantity > availableStock) {
          if (availableStock <= 0) {
            throw new ConflictError(`Garment "${product.title}" (${item.sku}) is currently out of stock.`);
          }
          throw new ConflictError(
            `Insufficient stock for "${product.title}" (${item.sku}). Only ${availableStock} units remaining.`
          );
        }
      }

      const itemSubtotal = livePrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        id: randomUUID(),
        productId: product._id,
        variantId: variant && (variant as any)._id ? (variant as any)._id : null,
        title: product.title,
        sku: variant ? variant.sku : product.sku,
        price: livePrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        image: variant?.image || product.images?.[0]?.url || "",
        color: variant?.color || "",
        size: variant?.size || "",
      });

      // 4. Reserve stock in Inventory and log StockMovement
      if (product.trackQuantity) {
        if (inventoryDoc) {
          const prevReserved = inventoryDoc.reserved;
          inventoryDoc.reserved += item.quantity;
          await inventoryDoc.save();

          // Log movement
          await StockMovement.create({
            inventoryId: inventoryDoc._id,
            productId: product._id,
            variantId: inventoryDoc.variantId || null,
            sku: inventoryDoc.sku,
            type: "reservation",
            quantity: item.quantity,
            previousOnHand: inventoryDoc.onHand,
            newOnHand: inventoryDoc.onHand,
            previousReserved: prevReserved,
            newReserved: inventoryDoc.reserved,
            reason: `Customer Order Checkout (${input.customerEmail})`,
            userId: userId && mongoose.Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
            userName: input.customerName,
          });
        } else {
          // Adjust stock on Product model if separate inventory doc not present
          product.stock = Math.max(0, product.stock - item.quantity);
          if (variant) {
            variant.stock = Math.max(0, variant.stock - item.quantity);
          }
          await product.save();
        }
      }
    }

    // 5. Final Server Calculation (Never trust client prices or totals)
    const discountPercent = cartDoc.discountPercent || 0;
    const discount =
      discountPercent > 0 ? Math.round(((subtotal * discountPercent) / 100) * 100) / 100 : 0;
    const discountedSubtotal = Math.max(0, subtotal - discount);

    let shippingCost = 0;
    if (input.shippingMethod === "express") {
      shippingCost = EXPRESS_SHIPPING_FEE;
    } else {
      shippingCost = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    }

    const tax = Math.round(discountedSubtotal * ESTIMATED_TAX_RATE * 100) / 100;
    const total = Math.round((discountedSubtotal + shippingCost + tax) * 100) / 100;

    // 6. Generate Human-Friendly Order Number
    const orderNumber = `VY-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const shippingAddress = {
      firstName: input.shippingAddress.firstName || input.customerName.split(" ")[0] || "Guest",
      lastName: input.shippingAddress.lastName || input.customerName.split(" ").slice(1).join(" ") || "Patron",
      street: input.shippingAddress.street,
      apartment: input.shippingAddress.apartment || "",
      city: input.shippingAddress.city,
      state: input.shippingAddress.state,
      postalCode: input.shippingAddress.postalCode,
      country: input.shippingAddress.country || "India",
      phone: input.shippingAddress.phone || "",
    };

    const billingAddress =
      input.sameAsShipping || !input.billingAddress
        ? shippingAddress
        : {
            firstName: input.billingAddress.firstName || shippingAddress.firstName,
            lastName: input.billingAddress.lastName || shippingAddress.lastName,
            street: input.billingAddress.street,
            apartment: input.billingAddress.apartment || "",
            city: input.billingAddress.city,
            state: input.billingAddress.state,
            postalCode: input.billingAddress.postalCode,
            country: input.billingAddress.country || "India",
            phone: input.billingAddress.phone || "",
          };

    // 7. Persist Order in MongoDB
    const order = new Order({
      orderNumber,
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
      guestId: guestId || null,
      customerEmail: input.customerEmail.toLowerCase().trim(),
      customerName: input.customerName.trim(),
      items: orderItems,
      shippingAddress,
      billingAddress,
      shippingMethod: input.shippingMethod,
      shippingCost,
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      tax,
      total,
      couponCode: cartDoc.couponCode || null,
      status: "pending", // Payment integration not in Phase I
      idempotencyKey: input.idempotencyKey ? input.idempotencyKey.trim() : null,
      customerNote: input.customerNote || null,
    });

    await order.save();

    // 8. Clear Active Shopping Cart
    await cartService.clearCart(userId, guestId);

    return this.toOrderDto(order);
  }

  // ==========================================
  // 4. ORDER QUERIES
  // ==========================================

  public async getOrderById(
    orderIdOrNumber: string,
    userId?: string,
    guestId?: string
  ): Promise<OrderDto> {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrNumber);
    const query: Record<string, any> = isObjectId
      ? { $or: [{ _id: new Types.ObjectId(orderIdOrNumber) }, { orderNumber: orderIdOrNumber.toUpperCase() }] }
      : { orderNumber: orderIdOrNumber.toUpperCase() };

    const order = await Order.findOne(query);
    if (!order) {
      throw new NotFoundError("Order not found with specified identifier.");
    }

    // Optional access control if userId or guestId is specified
    if (userId && order.userId && order.userId.toString() !== userId) {
      throw new NotFoundError("Order not found.");
    } else if (!userId && guestId && order.guestId && order.guestId !== guestId) {
      throw new NotFoundError("Order not found.");
    }

    return this.toOrderDto(order);
  }

  public async listOrders(userId?: string, guestId?: string): Promise<OrderDto[]> {
    const query: Record<string, any> = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new Types.ObjectId(userId);
    } else if (guestId) {
      query.guestId = guestId;
    } else {
      return [];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return orders.map((o) => this.toOrderDto(o));
  }
}

export const checkoutService = new CheckoutService();
