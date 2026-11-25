/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from "mongoose";
import { User, IUser } from "../../auth/models/user.model";
import { Order, IOrder } from "../../checkout/models/order.model";
import { Address, IAddress } from "../../checkout/models/address.model";
import { CustomerActivity, ICustomerActivity } from "../models/customer-activity.model";
import { checkoutService } from "../../checkout/services/checkout.service";
import {
  CustomerDto,
  CustomerDetailDto,
  CustomerActivityDto,
  AdminCustomerListQuery,
  PaginatedCustomersDto,
  UpdateCustomerStatusPayload,
  AddressDto,
  PaginatedOrdersDto,
  ApiCustomerAdminCode,
} from "@veyora/types";
import { NotFoundError } from "@veyora/utils";

export interface CustomerStats {
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt?: string | null;
}

export class CustomerService {
  /**
   * Helper: Map User and OrderStats to CustomerDto
   */
  public toCustomerDto(user: IUser, stats?: CustomerStats): CustomerDto {
    const ordersCount = stats?.ordersCount ?? 0;
    const totalSpent = stats?.totalSpent ?? 0;
    const averageOrderValue =
      stats?.averageOrderValue ??
      (ordersCount > 0 ? Math.round((totalSpent / ordersCount) * 100) / 100 : 0);

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone || null,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      statusReason: user.statusReason || null,
      notes: user.notes || null,
      ordersCount,
      totalSpent,
      averageOrderValue,
      lastOrderAt: stats?.lastOrderAt || null,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Helper: Map ICustomerActivity to CustomerActivityDto
   */
  public toActivityDto(activity: ICustomerActivity): CustomerActivityDto {
    return {
      id: activity._id.toString(),
      customerId: activity.customerId.toString(),
      action: activity.action,
      performedBy: activity.performedBy,
      performerRole: activity.performerRole,
      details: activity.details || undefined,
      reason: activity.reason || null,
      timestamp: activity.createdAt
        ? new Date(activity.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * 1. LIST CUSTOMERS (ADMIN)
   * Supports Search, Status Filters, Email Verification Filter, and Pagination
   */
  public async listCustomers(query?: AdminCustomerListQuery): Promise<PaginatedCustomersDto> {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { role: "customer" };

    // Search filter across first name, last name, email, or phone
    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, "i");
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
    }

    // Status filter
    if (query?.status && query.status !== "all") {
      filter.isActive = query.status === "active";
    }

    // Email verification filter
    if (query?.isEmailVerified !== undefined) {
      filter.isEmailVerified = query.isEmailVerified;
    }

    // Determine sort
    const sortOrder = query?.sortOrder === "asc" ? 1 : -1;
    let sortOptions: Record<string, any> = { createdAt: sortOrder };

    if (query?.sortBy === "name") {
      sortOptions = { firstName: sortOrder, lastName: sortOrder };
    } else if (query?.sortBy === "createdAt") {
      sortOptions = { createdAt: sortOrder };
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort(sortOptions).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    // Batch aggregate stats for the retrieved customers
    const userIds = users.map((u) => u._id);
    const statsMap = await this.batchGetCustomerStats(userIds);

    const items = users.map((user) => {
      const stats = statsMap.get(user._id.toString()) || {
        ordersCount: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderAt: null,
      };
      return this.toCustomerDto(user, stats);
    });

    // In-memory sort if requested by aggregate metric
    if (query?.sortBy === "ordersCount") {
      items.sort((a, b) =>
        query.sortOrder === "asc" ? a.ordersCount - b.ordersCount : b.ordersCount - a.ordersCount
      );
    } else if (query?.sortBy === "totalSpent") {
      items.sort((a, b) =>
        query.sortOrder === "asc" ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent
      );
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 2. GET CUSTOMER DETAILS (ADMIN)
   * Returns Customer Profile, Addresses, Recent Orders, and Lifetime Metrics
   */
  public async getCustomerById(id: string): Promise<CustomerDetailDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const stats = await this.getCustomerStats(user._id);

    // Fetch customer's saved addresses
    const addresses = await Address.find({ userId: user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    const addressDtos = addresses.map((a: IAddress) => checkoutService.toAddressDto(a));

    // Fetch customer's recent orders
    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10);
    const orderDtos = orders.map((o: IOrder) => checkoutService.toOrderDto(o));

    const baseDto = this.toCustomerDto(user, stats);

    return {
      ...baseDto,
      addresses: addressDtos,
      recentOrders: orderDtos,
    };
  }

  /**
   * 3. GET CUSTOMER ORDERS (ADMIN)
   */
  public async getCustomerOrders(
    id: string,
    pagination?: { page?: number; limit?: number }
  ): Promise<PaginatedOrdersDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const page = Math.max(1, Number(pagination?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination?.limit) || 10));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ userId: user._id }),
    ]);

    return {
      items: orders.map((o: IOrder) => checkoutService.toOrderDto(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 4. GET CUSTOMER ADDRESSES (ADMIN)
   */
  public async getCustomerAddresses(id: string): Promise<AddressDto[]> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const addresses = await Address.find({ userId: user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    return addresses.map((a: IAddress) => checkoutService.toAddressDto(a));
  }

  /**
   * 5. UPDATE CUSTOMER STATUS (ADMIN)
   * Activates/Deactivates customer and writes an immutable audit activity log
   */
  public async updateCustomerStatus(
    id: string,
    payload: UpdateCustomerStatusPayload,
    adminUser: { id: string; email: string; role?: string }
  ): Promise<CustomerDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const previousStatus = user.isActive;
    user.isActive = payload.isActive;
    if (payload.reason !== undefined) {
      user.statusReason = payload.reason ? payload.reason.trim() : null;
    }

    await user.save();

    // Log account activity
    await CustomerActivity.create({
      customerId: user._id,
      action: payload.isActive ? "CUSTOMER_ACTIVATED" : "CUSTOMER_DEACTIVATED",
      performedBy: adminUser.email || adminUser.id,
      performerRole: adminUser.role || "admin",
      details: {
        previousStatus: previousStatus ? "active" : "inactive",
        newStatus: payload.isActive ? "active" : "inactive",
      },
      reason:
        payload.reason ||
        (payload.isActive ? "Customer account re-activated." : "Customer account suspended."),
    });

    const stats = await this.getCustomerStats(user._id);
    return this.toCustomerDto(user, stats);
  }

  /**
   * 6. UPDATE CUSTOMER INTERNAL NOTES (ADMIN)
   */
  public async updateCustomerNotes(
    id: string,
    payload: { notes: string },
    adminUser: { id: string; email: string; role?: string }
  ): Promise<CustomerDto> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    user.notes = payload.notes ? payload.notes.trim() : null;
    await user.save();

    await CustomerActivity.create({
      customerId: user._id,
      action: "NOTE_UPDATED",
      performedBy: adminUser.email || adminUser.id,
      performerRole: adminUser.role || "admin",
      details: { noteLength: user.notes?.length || 0 },
      reason: "Internal customer dossier updated.",
    });

    const stats = await this.getCustomerStats(user._id);
    return this.toCustomerDto(user, stats);
  }

  /**
   * 7. GET CUSTOMER ACTIVITY AUDIT LOG (ADMIN)
   */
  public async getCustomerActivity(id: string): Promise<CustomerActivityDto[]> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError(
        "Customer not found.",
        undefined,
        ApiCustomerAdminCode.CUSTOMER_NOT_FOUND
      );
    }

    const activities = await CustomerActivity.find({ customerId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return activities.map((a) => this.toActivityDto(a));
  }

  /**
   * Internal Helper: Calculate Lifetime Stats for single customer
   */
  private async getCustomerStats(userId: Types.ObjectId): Promise<CustomerStats> {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    const nonCancelledOrders = orders.filter((o) => o.status !== "cancelled");

    const ordersCount = orders.length;
    let totalSpent = 0;
    for (const ord of nonCancelledOrders) {
      totalSpent += ord.total || 0;
    }
    totalSpent = Math.round(totalSpent * 100) / 100;
    const averageOrderValue =
      nonCancelledOrders.length > 0
        ? Math.round((totalSpent / nonCancelledOrders.length) * 100) / 100
        : 0;
    const lastOrderAt =
      orders.length > 0 && orders[0]?.createdAt
        ? new Date(orders[0].createdAt).toISOString()
        : null;

    return {
      ordersCount,
      totalSpent,
      averageOrderValue,
      lastOrderAt,
    };
  }

  /**
   * Internal Helper: Batch calculate customer stats
   */
  private async batchGetCustomerStats(
    userIds: Types.ObjectId[]
  ): Promise<Map<string, CustomerStats>> {
    const statsMap = new Map<string, CustomerStats>();
    if (userIds.length === 0) return statsMap;

    // Fetch all orders for these users
    const orders = await Order.find({ userId: { $in: userIds } }).sort({ createdAt: -1 });

    for (const id of userIds) {
      const idStr = id.toString();
      const userOrders = orders.filter((o) => o.userId && o.userId.toString() === idStr);
      const nonCancelled = userOrders.filter((o) => o.status !== "cancelled");

      const ordersCount = userOrders.length;
      let totalSpent = 0;
      for (const ord of nonCancelled) {
        totalSpent += ord.total || 0;
      }
      totalSpent = Math.round(totalSpent * 100) / 100;
      const averageOrderValue =
        nonCancelled.length > 0 ? Math.round((totalSpent / nonCancelled.length) * 100) / 100 : 0;
      const lastOrderAt =
        userOrders.length > 0 && userOrders[0]?.createdAt
          ? new Date(userOrders[0].createdAt).toISOString()
          : null;

      statsMap.set(idStr, {
        ordersCount,
        totalSpent,
        averageOrderValue,
        lastOrderAt,
      });
    }

    return statsMap;
  }
}

export const customerService = new CustomerService();
