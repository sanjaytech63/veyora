/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession, Types } from "mongoose";
import { Coupon, ICoupon } from "../models/coupon.model";
import { CouponUsage } from "../models/coupon-usage.model";
import {
  CouponDto,
  CouponStatus,
  CouponValidationResultDto,
  CouponAnalyticsDto,
  CreateCouponPayload,
  UpdateCouponPayload,
  ValidateCouponItem,
  AdminCouponListQuery,
  PaginatedCouponsDto,
} from "@veyora/types";
import { BadRequestError, ConflictError, NotFoundError, logger } from "@veyora/utils";

export class CouponService {
  /**
   * Helper: Map Mongoose ICoupon to CouponDto
   */
  public toCouponDto(coupon: ICoupon): CouponDto {
    const now = new Date();
    let status: CouponStatus = "active";
    if (!coupon.isActive) {
      status = "inactive";
    } else if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      status = "expired";
    } else if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      status = "inactive";
    } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      status = "expired";
    }

    return {
      id: coupon._id.toString(),
      code: coupon.code,
      description: coupon.description || undefined,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || undefined,
      startsAt: coupon.startsAt.toISOString(),
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : undefined,
      usageLimit: coupon.usageLimit || undefined,
      usageCount: coupon.usageCount,
      perCustomerLimit: coupon.perCustomerLimit || undefined,
      applicableProducts: (coupon.applicableProducts || []).map((p) => p.toString()),
      applicableCategories: (coupon.applicableCategories || []).map((c) => c.toString()),
      excludedProducts: (coupon.excludedProducts || []).map((p) => p.toString()),
      isActive: coupon.isActive,
      status,
      analytics: {
        totalDiscountGiven: coupon.analytics?.totalDiscountGiven || 0,
        totalRevenueGenerated: coupon.analytics?.totalRevenueGenerated || 0,
        lastUsedAt: coupon.analytics?.lastUsedAt
          ? coupon.analytics.lastUsedAt.toISOString()
          : undefined,
      },
      createdAt: coupon.createdAt
        ? new Date(coupon.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: coupon.updatedAt
        ? new Date(coupon.updatedAt).toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * 1. VALIDATE AND CALCULATE DISCOUNT
   * Core promotional calculation engine. Never trusts client calculations.
   */
  public async validateAndCalculateDiscount(
    code: string,
    cartTotal: number | undefined,
    items: ValidateCouponItem[] | undefined,
    customer?: { userId?: string; email?: string }
  ): Promise<CouponValidationResultDto> {
    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      throw new NotFoundError(`Coupon code "${cleanCode}" is invalid.`);
    }

    const now = new Date();

    // 1. Activation check
    if (!coupon.isActive) {
      throw new BadRequestError(`Coupon "${cleanCode}" is currently inactive.`);
    }

    // 2. Schedule window: startsAt
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      throw new BadRequestError(`Coupon "${cleanCode}" is not yet active.`);
    }

    // 3. Schedule window: expiresAt
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      throw new BadRequestError(`Coupon "${cleanCode}" has expired.`);
    }

    // 4. Global Usage Limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestError(`Coupon "${cleanCode}" has reached its maximum redemption limit.`);
    }

    // 5. Per-Customer Limit
    const patronIdentifier = customer?.userId || customer?.email?.toLowerCase().trim();
    if (coupon.perCustomerLimit && patronIdentifier) {
      const customerRecord = coupon.customerUsage.find(
        (u: any) => u.customerIdOrEmail.toLowerCase() === patronIdentifier.toLowerCase()
      );
      if (customerRecord && customerRecord.usageCount >= coupon.perCustomerLimit) {
        throw new BadRequestError(
          `You have reached the maximum redemption limit (${coupon.perCustomerLimit}) for coupon "${cleanCode}".`
        );
      }
    }

    // 6. Product-Specific & Category-Specific Rules
    let eligibleSubtotal = 0;
    const hasProductRules = coupon.applicableProducts && coupon.applicableProducts.length > 0;
    const hasCategoryRules = coupon.applicableCategories && coupon.applicableCategories.length > 0;
    const hasExclusions = coupon.excludedProducts && coupon.excludedProducts.length > 0;

    if (items && items.length > 0) {
      for (const item of items) {
        const pId = item.productId.toString();
        const cId = item.categoryId ? item.categoryId.toString() : "";

        // Check exclusions
        if (hasExclusions && coupon.excludedProducts.some((ex: any) => ex.toString() === pId)) {
          continue;
        }

        // Check inclusions
        let isEligible = true;
        if (hasProductRules || hasCategoryRules) {
          const productMatch =
            hasProductRules && coupon.applicableProducts.some((p: any) => p.toString() === pId);
          const categoryMatch =
            hasCategoryRules && coupon.applicableCategories.some((c: any) => c.toString() === cId);
          isEligible = Boolean(productMatch || categoryMatch);
        }

        if (isEligible) {
          eligibleSubtotal += item.price * item.quantity;
        }
      }

      if ((hasProductRules || hasCategoryRules) && eligibleSubtotal <= 0) {
        throw new BadRequestError(
          `Coupon "${cleanCode}" is not applicable to any items currently in your bag.`
        );
      }
    } else {
      eligibleSubtotal = cartTotal || 0;
    }

    // 7. Minimum Order Spend
    if (coupon.minimumOrderAmount > 0 && eligibleSubtotal < coupon.minimumOrderAmount) {
      throw new BadRequestError(
        `Coupon "${cleanCode}" requires a minimum spend of $${coupon.minimumOrderAmount.toFixed(
          2
        )} on eligible items (current: $${eligibleSubtotal.toFixed(2)}).`
      );
    }

    // 8. Discount Calculation
    let discountAmount = 0;
    const normType = coupon.discountType;

    if (normType === "percentage") {
      discountAmount = (eligibleSubtotal * coupon.discountValue) / 100;
      // Cap at max discount if configured
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      isValid: true,
      code: coupon.code,
      discountType: normType,
      discountValue: coupon.discountValue,
      discountAmount,
      eligibleSubtotal: Math.round(eligibleSubtotal * 100) / 100,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || undefined,
      description: coupon.description || undefined,
      message: `Coupon "${cleanCode}" applied successfully ($${discountAmount.toFixed(2)} savings).`,
    };
  }

  /**
   * 2. RECORD COUPON USAGE (Atomic & Transaction-Aware)
   */
  public async recordCouponUsage(
    code: string,
    usage: {
      orderId?: string;
      orderNumber?: string;
      userId?: string;
      customerEmail: string;
      discountAmount: number;
      orderTotal: number;
    },
    session?: ClientSession
  ): Promise<void> {
    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode }).session(session || null);
    if (!coupon) return;

    const patronId = (usage.userId || usage.customerEmail).toLowerCase().trim();

    // 1. Increment usage count & customer usage record
    coupon.usageCount += 1;
    const existingCustomerUsage = coupon.customerUsage.find(
      (u: any) => u.customerIdOrEmail.toLowerCase() === patronId
    );

    if (existingCustomerUsage) {
      existingCustomerUsage.usageCount += 1;
      existingCustomerUsage.lastUsedAt = new Date();
    } else {
      coupon.customerUsage.push({
        customerIdOrEmail: patronId,
        usageCount: 1,
        lastUsedAt: new Date(),
      });
    }

    // 2. Update coupon analytics
    coupon.analytics = coupon.analytics || {
      totalDiscountGiven: 0,
      totalRevenueGenerated: 0,
      lastUsedAt: null,
    };
    coupon.analytics.totalDiscountGiven =
      Math.round((coupon.analytics.totalDiscountGiven + usage.discountAmount) * 100) / 100;
    coupon.analytics.totalRevenueGenerated =
      Math.round((coupon.analytics.totalRevenueGenerated + usage.orderTotal) * 100) / 100;
    coupon.analytics.lastUsedAt = new Date();

    await coupon.save({ session });

    // 3. Record individual redemption entry in CouponUsage collection
    const usageDoc = new CouponUsage({
      couponId: coupon._id,
      couponCode: coupon.code,
      orderId: usage.orderId ? new Types.ObjectId(usage.orderId) : null,
      orderNumber: usage.orderNumber || null,
      userId: usage.userId ? new Types.ObjectId(usage.userId) : null,
      customerEmail: usage.customerEmail.toLowerCase().trim(),
      discountAmount: usage.discountAmount,
      orderTotal: usage.orderTotal,
      status: "applied",
      appliedAt: new Date(),
    });

    await usageDoc.save({ session });

    logger.info(
      "COUPON",
      `Coupon "${cleanCode}" successfully redeemed for order ${usage.orderNumber || usage.orderId}`,
      {
        discountAmount: usage.discountAmount,
        totalUsage: coupon.usageCount,
      }
    );
  }

  /**
   * 3. REVERT COUPON USAGE (When order is cancelled)
   */
  public async revertCouponUsage(
    code: string,
    reversal: {
      orderId?: string;
      customerEmail?: string;
    },
    session?: ClientSession
  ): Promise<void> {
    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode }).session(session || null);
    if (!coupon) return;

    if (coupon.usageCount > 0) {
      coupon.usageCount -= 1;
    }

    if (reversal.customerEmail) {
      const patronId = reversal.customerEmail.toLowerCase().trim();
      const existing = coupon.customerUsage.find(
        (u: any) => u.customerIdOrEmail.toLowerCase() === patronId
      );
      if (existing && existing.usageCount > 0) {
        existing.usageCount -= 1;
      }
    }

    await coupon.save({ session });

    if (reversal.orderId) {
      await CouponUsage.updateOne(
        { orderId: new Types.ObjectId(reversal.orderId), status: "applied" },
        { status: "reverted", revertedAt: new Date() },
        { session }
      );
    }
  }

  /**
   * 4. CREATE COUPON (ADMIN)
   */
  public async createCoupon(payload: CreateCouponPayload): Promise<CouponDto> {
    const cleanCode = payload.code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      throw new ConflictError(`Coupon with code "${cleanCode}" already exists.`);
    }

    const normType = payload.discountType;

    const coupon = new Coupon({
      code: cleanCode,
      description: payload.description || null,
      discountType: normType,
      discountValue: payload.discountValue,
      minimumOrderAmount: payload.minimumOrderAmount || 0,
      maxDiscountAmount: payload.maxDiscountAmount || null,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : new Date(),
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      usageLimit: payload.usageLimit || null,
      perCustomerLimit: payload.perCustomerLimit || null,
      applicableProducts: (payload.applicableProducts || []).map((id) => new Types.ObjectId(id)),
      applicableCategories: (payload.applicableCategories || []).map(
        (id) => new Types.ObjectId(id)
      ),
      excludedProducts: (payload.excludedProducts || []).map((id) => new Types.ObjectId(id)),
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      usageCount: 0,
      customerUsage: [],
      analytics: {
        totalDiscountGiven: 0,
        totalRevenueGenerated: 0,
        lastUsedAt: null,
      },
    });

    await coupon.save();
    return this.toCouponDto(coupon);
  }

  /**
   * 5. UPDATE COUPON (ADMIN)
   */
  public async updateCoupon(id: string, payload: UpdateCouponPayload): Promise<CouponDto> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon not found.");
    }

    if (payload.code && payload.code.trim().toUpperCase() !== coupon.code) {
      const cleanCode = payload.code.trim().toUpperCase();
      const existing = await Coupon.findOne({ code: cleanCode, _id: { $ne: coupon._id } });
      if (existing) {
        throw new ConflictError(`Another coupon with code "${cleanCode}" already exists.`);
      }
      coupon.code = cleanCode;
    }

    if (payload.description !== undefined) coupon.description = payload.description;
    if (payload.discountType !== undefined) {
      coupon.discountType = payload.discountType;
    }
    if (payload.discountValue !== undefined) coupon.discountValue = payload.discountValue;
    if (payload.minimumOrderAmount !== undefined)
      coupon.minimumOrderAmount = payload.minimumOrderAmount;
    if (payload.maxDiscountAmount !== undefined)
      coupon.maxDiscountAmount = payload.maxDiscountAmount;
    if (payload.startsAt !== undefined) coupon.startsAt = new Date(payload.startsAt);
    if (payload.expiresAt !== undefined)
      coupon.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
    if (payload.usageLimit !== undefined) coupon.usageLimit = payload.usageLimit;
    if (payload.perCustomerLimit !== undefined) coupon.perCustomerLimit = payload.perCustomerLimit;
    if (payload.applicableProducts !== undefined) {
      coupon.applicableProducts = payload.applicableProducts.map((p) => new Types.ObjectId(p));
    }
    if (payload.applicableCategories !== undefined) {
      coupon.applicableCategories = payload.applicableCategories.map((c) => new Types.ObjectId(c));
    }
    if (payload.excludedProducts !== undefined) {
      coupon.excludedProducts = payload.excludedProducts.map((p) => new Types.ObjectId(p));
    }
    if (payload.isActive !== undefined) coupon.isActive = payload.isActive;

    await coupon.save();
    return this.toCouponDto(coupon);
  }

  /**
   * 6. TOGGLE COUPON STATUS (ADMIN)
   */
  public async toggleCouponStatus(id: string): Promise<CouponDto> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon not found.");
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return this.toCouponDto(coupon);
  }

  /**
   * 7. DELETE COUPON (ADMIN)
   */
  public async deleteCoupon(id: string): Promise<void> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon not found.");
    }
    await Coupon.findByIdAndDelete(id);
  }

  /**
   * 8. GET COUPON BY ID (ADMIN)
   */
  public async getCouponById(id: string): Promise<CouponDto> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon not found.");
    }
    return this.toCouponDto(coupon);
  }

  /**
   * 9. LIST COUPONS (ADMIN)
   */
  public async listCoupons(query?: AdminCouponListQuery): Promise<PaginatedCouponsDto> {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query?.search) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      filter.$or = [{ code: searchRegex }, { description: searchRegex }];
    }

    const now = new Date();
    if (query?.status && query.status !== "all") {
      if (query.status === "active") {
        filter.isActive = true;
        filter.$and = [
          { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
          {
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: null },
              { expiresAt: { $gt: now } },
            ],
          },
        ];
      } else if (query.status === "inactive") {
        filter.isActive = false;
      } else if (query.status === "expired") {
        filter.$or = [
          { expiresAt: { $lte: now } },
          { $expr: { $gte: ["$usageCount", "$usageLimit"] } },
        ];
      }
    }

    const sortField = query?.sortBy || "createdAt";
    const sortDirection = query?.sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Coupon.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments(filter),
    ]);

    return {
      items: items.map((c: any) => this.toCouponDto(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 10. GET COUPON ANALYTICS (ADMIN)
   */
  public async getCouponAnalytics(id: string): Promise<CouponAnalyticsDto> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon not found.");
    }

    const redemptions = await CouponUsage.find({ couponId: coupon._id, status: "applied" })
      .sort({ appliedAt: -1 })
      .limit(20);

    const averageOrderValue =
      coupon.usageCount > 0
        ? Math.round((coupon.analytics.totalRevenueGenerated / coupon.usageCount) * 100) / 100
        : 0;

    const couponDto = this.toCouponDto(coupon);

    return {
      couponId: coupon._id.toString(),
      code: coupon.code,
      status: couponDto.status,
      usageCount: coupon.usageCount,
      usageLimit: coupon.usageLimit || undefined,
      totalDiscountGiven: coupon.analytics.totalDiscountGiven,
      totalRevenueGenerated: coupon.analytics.totalRevenueGenerated,
      averageOrderValue,
      lastUsedAt: coupon.analytics.lastUsedAt
        ? coupon.analytics.lastUsedAt.toISOString()
        : undefined,
      recentRedemptions: redemptions.map((r: any) => ({
        orderId: r.orderId ? r.orderId.toString() : "",
        orderNumber: r.orderNumber || "N/A",
        customerEmail: r.customerEmail,
        discountAmount: r.discountAmount,
        orderTotal: r.orderTotal,
        appliedAt: r.appliedAt.toISOString(),
      })),
    };
  }
}

export const couponService = new CouponService();
