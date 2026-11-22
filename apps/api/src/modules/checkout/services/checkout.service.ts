/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import mongoose, { Types } from "mongoose";
import { Address, IAddress } from "../models/address.model";
import { Order, IOrder, IOrderItem } from "../models/order.model";
import { cartService } from "../../cart/services/cart.service";
import { Product, IProduct } from "../../catalog/models/product.model";
import { Inventory } from "../../inventory/models/inventory.model";
import { StockMovement } from "../../inventory/models/stock-movement.model";
import { couponService } from "../../coupon/services/coupon.service";
import { notificationService } from "../../notification/services/notification.service";
import { queueRegistry } from "../../../infrastructure/queues/queue-registry";
import { eventPublisher } from "../../../infrastructure/events/event-publisher";
import {
  AddressDto,
  CreateAddressPayload,
  UpdateAddressPayload,
  OrderDto,
  OrderStatus,
  CheckoutValidationDto,
  ShippingMethodOption,
  AdminOrderListQuery,
  PaginatedOrdersDto,
} from "@veyora/types";
import { CreateOrderCheckoutInput } from "@veyora/validators";
import { BadRequestError, ConflictError, NotFoundError } from "@veyora/utils";

const FREE_SHIPPING_THRESHOLD = 150;
const STANDARD_SHIPPING_FEE = 15;
const EXPRESS_SHIPPING_FEE = 25;
const ESTIMATED_TAX_RATE = 0.08;

/**
 * Strict Order Lifecycle State Machine
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "refund_pending"],
  delivered: ["refund_pending"],
  refund_pending: ["refunded", "delivered"],
  cancelled: [], // Terminal
  refunded: [], // Terminal
};

export class CheckoutService {
  public toAddressDto(doc: IAddress): AddressDto {
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

  public toOrderDto(doc: IOrder): OrderDto {
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
      statusHistory: (doc.statusHistory || []).map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedBy: h.changedBy || undefined,
        role: h.role || undefined,
        reason: h.reason || undefined,
        timestamp: h.timestamp instanceof Date ? h.timestamp.toISOString() : String(h.timestamp),
      })),
      tracking: doc.tracking
        ? {
            carrier: doc.tracking.carrier || undefined,
            trackingNumber: doc.tracking.trackingNumber || undefined,
            trackingUrl: doc.tracking.trackingUrl || undefined,
            estimatedDeliveryDate: doc.tracking.estimatedDeliveryDate || undefined,
            shippedAt: doc.tracking.shippedAt ? doc.tracking.shippedAt.toISOString() : undefined,
            deliveredAt: doc.tracking.deliveredAt
              ? doc.tracking.deliveredAt.toISOString()
              : undefined,
          }
        : undefined,
      cancelReason: doc.cancelReason || undefined,
      cancelledAt: doc.cancelledAt ? doc.cancelledAt.toISOString() : undefined,
      createdAt: doc.createdAt
        ? doc.createdAt instanceof Date
          ? doc.createdAt.toISOString()
          : new Date(doc.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: doc.updatedAt
        ? doc.updatedAt instanceof Date
          ? doc.updatedAt.toISOString()
          : new Date(doc.updatedAt).toISOString()
        : new Date().toISOString(),
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
    const isUser = Boolean(userId && mongoose.Types.ObjectId.isValid(userId));

    if (payload.isDefault) {
      const filter: Record<string, any> = {};
      if (isUser) {
        filter.userId = new Types.ObjectId(userId);
      } else {
        filter.guestId = guestId;
      }
      await Address.updateMany(filter, { $set: { isDefault: false } });
    } else {
      const filter: Record<string, any> = {};
      if (isUser) {
        filter.userId = new Types.ObjectId(userId);
      } else {
        filter.guestId = guestId;
      }
      const count = await Address.countDocuments(filter);
      if (count === 0) {
        payload.isDefault = true;
      }
    }

    const address = new Address({
      userId: isUser ? new Types.ObjectId(userId) : null,
      guestId: !isUser && guestId ? guestId : null,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      street: payload.street.trim(),
      apartment: payload.apartment?.trim() || null,
      city: payload.city.trim(),
      state: payload.state.trim(),
      postalCode: payload.postalCode.trim(),
      country: payload.country.trim(),
      phone: payload.phone?.trim() || null,
      isDefault: Boolean(payload.isDefault),
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

    if (userId && address.userId && address.userId.toString() !== userId) {
      throw new BadRequestError("You are not authorized to edit this address.");
    } else if (!userId && guestId && address.guestId !== guestId) {
      throw new BadRequestError("You are not authorized to edit this address.");
    }

    if (payload.isDefault) {
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
            throw new ConflictError(
              `Garment "${product.title}" (${item.sku}) is currently out of stock.`
            );
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
            userId:
              userId && mongoose.Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
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

    // 5. Calculate Discount, Shipping, Tax, Total
    const discountPercent = cartDoc.discountPercent || 0;
    const discount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
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
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `VY-ORD-${randomDigits}`;

    // 7. Resolve Billing Address
    const shippingAddress = {
      firstName: (
        input.shippingAddress.firstName ||
        input.customerName.split(" ")[0] ||
        "Patron"
      ).trim(),
      lastName: (
        input.shippingAddress.lastName ||
        input.customerName.split(" ").slice(1).join(" ") ||
        ""
      ).trim(),
      street: input.shippingAddress.street.trim(),
      apartment: input.shippingAddress.apartment?.trim() || "",
      city: input.shippingAddress.city.trim(),
      state: input.shippingAddress.state.trim(),
      postalCode: input.shippingAddress.postalCode.trim(),
      country: input.shippingAddress.country.trim(),
      phone: input.shippingAddress.phone?.trim() || "",
    };

    const billingAddress =
      input.sameAsShipping || !input.billingAddress
        ? shippingAddress
        : {
            firstName: (input.billingAddress.firstName || shippingAddress.firstName).trim(),
            lastName: (input.billingAddress.lastName || shippingAddress.lastName).trim(),
            street: input.billingAddress.street.trim(),
            apartment: input.billingAddress.apartment?.trim() || "",
            city: input.billingAddress.city.trim(),
            state: input.billingAddress.state.trim(),
            postalCode: input.billingAddress.postalCode.trim(),
            country: input.billingAddress.country.trim(),
            phone: input.billingAddress.phone?.trim() || "",
          };

    const initialHistory = [
      {
        fromStatus: undefined,
        toStatus: "pending" as OrderStatus,
        changedBy: userId || guestId || "patron",
        role: "customer",
        reason: "Order successfully placed via atelier checkout",
        timestamp: new Date(),
      },
    ];

    const order = new Order({
      orderNumber,
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
      guestId: !userId && guestId ? guestId : null,
      customerEmail: input.customerEmail.toLowerCase().trim(),
      customerName: input.customerName.trim(),
      items: orderItems,
      shippingAddress,
      billingAddress,
      shippingMethod: input.shippingMethod,
      shippingCost,
      subtotal,
      discount,
      tax,
      total,
      couponCode: cartDoc.couponCode || null,
      status: "pending",
      statusHistory: initialHistory,
      tracking: {},
      idempotencyKey: input.idempotencyKey ? input.idempotencyKey.trim() : null,
      customerNote: input.customerNote || null,
    });

    await order.save();

    // 8. Record Coupon Usage if coupon applied
    if (mongoose.connection.readyState === 1 && cartDoc.couponCode) {
      try {
        await couponService.recordCouponUsage(cartDoc.couponCode, {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          userId,
          customerEmail: input.customerEmail,
          discountAmount: discount,
          orderTotal: subtotal,
        });
      } catch (couponUsageErr) {
        console.warn(
          `[Checkout] Failed to record coupon usage for ${cartDoc.couponCode}:`,
          couponUsageErr
        );
      }
    }

    // 9. Clear Active Shopping Cart
    await cartService.clearCart(userId, guestId);

    // 10. Real-time Notification & Background Jobs
    try {
      if (order.userId) {
        await notificationService.createNotification({
          userId: order.userId.toString(),
          type: "order",
          title: "Order Placed Successfully",
          message: `Your reservation #${order.orderNumber} has been received and is being prepared by the Atelier.`,
          actionUrl: `/orders/${order._id.toString()}`,
          idempotencyKey: `order-placed:${order._id.toString()}`,
        });
      }

      await queueRegistry.addEmailJob({
        type: "order-confirmation",
        recipient: order.customerEmail,
        recipientName: order.customerName,
        data: {
          orderNumber: order.orderNumber,
          total: order.total,
          itemsCount: order.items.length,
        },
        idempotencyKey: `email:order-conf:${order._id.toString()}`,
      });

      eventPublisher.publishOrderUpdate(
        {
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          userId: order.userId?.toString(),
          total: order.total,
        },
        "created"
      );
    } catch {
      // Non-critical background event handling should not fail order placement
    }

    return this.toOrderDto(order);
  }

  // ==========================================
  // 4. ORDER QUERIES & ADMIN MANAGEMENT
  // ==========================================

  public async getOrderById(
    orderIdOrNumber: string,
    userId?: string,
    guestId?: string,
    isAdmin = false
  ): Promise<OrderDto> {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrNumber);
    const query: Record<string, any> = isObjectId
      ? {
          $or: [
            { _id: new Types.ObjectId(orderIdOrNumber) },
            { orderNumber: orderIdOrNumber.toUpperCase() },
          ],
        }
      : { orderNumber: orderIdOrNumber.toUpperCase() };

    const order = await Order.findOne(query);
    if (!order) {
      throw new NotFoundError("Order not found with specified identifier.");
    }

    if (!isAdmin) {
      if (userId && order.userId && order.userId.toString() !== userId) {
        throw new NotFoundError("Order not found.");
      } else if (!userId && guestId && order.guestId && order.guestId !== guestId) {
        throw new NotFoundError("Order not found.");
      }
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

  public async adminListOrders(query: AdminOrderListQuery): Promise<PaginatedOrdersDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      filter.$or = [
        { orderNumber: searchRegex },
        { customerEmail: searchRegex },
        { customerName: searchRegex },
      ];
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      items: orders.map((o) => this.toOrderDto(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ==========================================
  // 5. STATUS TRANSITIONS & CANCELLATIONS
  // ==========================================

  public async updateOrderStatus(
    orderIdOrNumber: string,
    newStatus: OrderStatus,
    adminUser: { id: string; email?: string; role?: string },
    options?: {
      reason?: string;
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      estimatedDeliveryDate?: string;
    }
  ): Promise<OrderDto> {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrNumber);
    const query: Record<string, any> = isObjectId
      ? {
          $or: [
            { _id: new Types.ObjectId(orderIdOrNumber) },
            { orderNumber: orderIdOrNumber.toUpperCase() },
          ],
        }
      : { orderNumber: orderIdOrNumber.toUpperCase() };

    const order = await Order.findOne(query);
    if (!order) {
      throw new NotFoundError("Order not found with specified identifier.");
    }

    const currentStatus = order.status;
    if (currentStatus === newStatus) {
      return this.toOrderDto(order);
    }

    const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: [${allowedNext.join(", ")}].`
      );
    }

    // Cancellation releases reserved inventory
    if (newStatus === "cancelled") {
      await this.releaseOrderStock(order, options?.reason || "Admin cancelled order", adminUser.id);
      order.cancelReason = options?.reason || "Cancelled by administrator";
      order.cancelledAt = new Date();
    }

    // Shipped sets tracking telemetry
    if (newStatus === "shipped") {
      if (!order.tracking) {
        order.tracking = {};
      }
      if (options?.carrier) order.tracking.carrier = options.carrier;
      if (options?.trackingNumber) order.tracking.trackingNumber = options.trackingNumber;
      if (options?.trackingUrl) order.tracking.trackingUrl = options.trackingUrl;
      if (options?.estimatedDeliveryDate)
        order.tracking.estimatedDeliveryDate = options.estimatedDeliveryDate;
      order.tracking.shippedAt = new Date();
    }

    // Delivered
    if (newStatus === "delivered") {
      if (!order.tracking) order.tracking = {};
      order.tracking.deliveredAt = new Date();
    }

    order.status = newStatus;
    order.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: newStatus,
      changedBy: adminUser.email || adminUser.id,
      role: adminUser.role || "admin",
      reason: options?.reason || `Status updated to ${newStatus}`,
      timestamp: new Date(),
    });

    await order.save();

    // Revert coupon redemption if refunded or cancelled
    if (
      mongoose.connection.readyState === 1 &&
      (newStatus === "refunded" || newStatus === "cancelled") &&
      order.couponCode
    ) {
      try {
        await couponService.revertCouponUsage(order.couponCode, {
          orderId: order._id.toString(),
          customerEmail: order.customerEmail,
        });
      } catch (err) {
        console.warn(`[Checkout] Failed to revert coupon usage for ${order.couponCode}:`, err);
      }
    }

    return this.toOrderDto(order);
  }

  public async cancelOrder(
    orderIdOrNumber: string,
    userId: string | undefined,
    guestId: string | undefined,
    reason?: string,
    isAdmin = false
  ): Promise<OrderDto> {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrNumber);
    const query: Record<string, any> = isObjectId
      ? {
          $or: [
            { _id: new Types.ObjectId(orderIdOrNumber) },
            { orderNumber: orderIdOrNumber.toUpperCase() },
          ],
        }
      : { orderNumber: orderIdOrNumber.toUpperCase() };

    const order = await Order.findOne(query);
    if (!order) {
      throw new NotFoundError("Order not found with specified identifier.");
    }

    // Authorization checks
    if (!isAdmin) {
      if (userId && order.userId && order.userId.toString() !== userId) {
        throw new NotFoundError("Order not found.");
      } else if (!userId && guestId && order.guestId && order.guestId !== guestId) {
        throw new NotFoundError("Order not found.");
      }

      // Customer cancellation business rule: only pending or confirmed can be cancelled
      if (order.status !== "pending" && order.status !== "confirmed") {
        throw new BadRequestError(
          `Order cannot be cancelled in "${order.status}" status. Please contact atelier customer care.`
        );
      }
    } else {
      const allowedNext = VALID_STATUS_TRANSITIONS[order.status] || [];
      if (!allowedNext.includes("cancelled")) {
        throw new BadRequestError(
          `Cannot cancel order in terminal or unmodifiable "${order.status}" state.`
        );
      }
    }

    const previousStatus = order.status;
    await this.releaseOrderStock(order, reason || "Order cancelled", userId || guestId || "user");

    order.status = "cancelled";
    order.cancelReason = reason || (isAdmin ? "Cancelled by administrator" : "Cancelled by patron");
    order.cancelledAt = new Date();
    order.statusHistory.push({
      fromStatus: previousStatus,
      toStatus: "cancelled",
      changedBy: userId || guestId || (isAdmin ? "administrator" : "patron"),
      role: isAdmin ? "admin" : "customer",
      reason: reason || "Order cancelled",
      timestamp: new Date(),
    });

    await order.save();

    // Notify customer and publish real-time cancellation
    try {
      if (order.userId) {
        await notificationService.createNotification({
          userId: order.userId.toString(),
          type: "order",
          title: "Order Cancelled",
          message: `Order #${order.orderNumber} has been cancelled.`,
          actionUrl: `/orders/${order._id.toString()}`,
          idempotencyKey: `order-cancelled:${order._id.toString()}:${Date.now()}`,
        });
      }

      await queueRegistry.addEmailJob({
        type: "order-cancellation",
        recipient: order.customerEmail,
        recipientName: order.customerName,
        data: {
          orderNumber: order.orderNumber,
          reason: order.cancelReason,
        },
        idempotencyKey: `email:order-cancel:${order._id.toString()}`,
      });

      eventPublisher.publishOrderUpdate(
        {
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          userId: order.userId?.toString(),
          total: order.total,
        },
        "cancelled"
      );
    } catch {
      // Non-critical background event
    }

    // Revert coupon redemption if applicable
    if (mongoose.connection.readyState === 1 && order.couponCode) {
      try {
        await couponService.revertCouponUsage(order.couponCode, {
          orderId: order._id.toString(),
          customerEmail: order.customerEmail,
        });
      } catch (err) {
        console.warn(`[Checkout] Failed to revert coupon usage for ${order.couponCode}:`, err);
      }
    }

    return this.toOrderDto(order);
  }

  private async releaseOrderStock(
    order: IOrder,
    reason: string,
    performerId: string
  ): Promise<void> {
    for (const item of order.items) {
      const invQuery: Record<string, any> = { productId: item.productId };
      if (item.variantId) {
        invQuery.variantId = item.variantId;
      } else {
        invQuery.variantId = null;
      }

      const inventoryDoc = await Inventory.findOne(invQuery);
      if (inventoryDoc) {
        const prevReserved = inventoryDoc.reserved;
        inventoryDoc.reserved = Math.max(0, inventoryDoc.reserved - item.quantity);
        await inventoryDoc.save();

        await StockMovement.create({
          inventoryId: inventoryDoc._id,
          productId: item.productId,
          variantId: inventoryDoc.variantId || null,
          sku: item.sku,
          type: "release",
          quantity: item.quantity,
          previousOnHand: inventoryDoc.onHand,
          newOnHand: inventoryDoc.onHand,
          previousReserved: prevReserved,
          newReserved: inventoryDoc.reserved,
          reason: `Order Cancellation (${order.orderNumber}): ${reason}`,
          userId: mongoose.Types.ObjectId.isValid(performerId)
            ? new Types.ObjectId(performerId)
            : null,
          userName: order.customerName,
        });
      } else {
        // Fallback: restore product or variant stock if separate inventory record not present
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.quantity;
          if (item.variantId && product.variants) {
            const v = product.variants.find(
              (vObj: any) => vObj._id?.toString() === item.variantId?.toString()
            );
            if (v) v.stock += item.quantity;
          }
          await product.save();
        }
      }
    }
  }
}

export const checkoutService = new CheckoutService();
