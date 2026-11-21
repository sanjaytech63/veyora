/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";

let mockCoupons: any[] = [];
let mockCouponUsages: any[] = [];

const mockAdminSessionId = new mongoose.Types.ObjectId();
const mockCustomerSessionId = new mongoose.Types.ObjectId();

function mockQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
    session: vi.fn(() => queryObj),
    then: (resolve: (val: T) => any, reject?: (err: any) => any) => {
      try {
        return Promise.resolve(execFn()).then(resolve, reject);
      } catch (err) {
        if (reject) return Promise.reject(err).catch(reject);
        throw err;
      }
    },
  };
  return queryObj;
}

// 1. Mock Session model for Auth
vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      if (
        idStr === mockAdminSessionId.toString() ||
        idStr === mockCustomerSessionId.toString()
      ) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(idStr),
          isRevoked: false,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        });
      }
      return Promise.resolve(null);
    }),
  },
}));

// 2. Mock Coupon Model
vi.mock("../modules/coupon/models/coupon.model", () => {
  const MockCouponModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      code: (data.code || "").toUpperCase().trim(),
      description: data.description || null,
      discountType: data.discountType || "percentage",
      discountValue: data.discountValue || 10,
      minimumOrderAmount: data.minimumOrderAmount || 0,
      maxDiscountAmount: data.maxDiscountAmount || null,
      startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      usageLimit: data.usageLimit || null,
      usageCount: data.usageCount || 0,
      perCustomerLimit: data.perCustomerLimit || null,
      customerUsage: data.customerUsage || [],
      applicableProducts: data.applicableProducts || [],
      applicableCategories: data.applicableCategories || [],
      excludedProducts: data.excludedProducts || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      analytics: data.analytics || {
        totalDiscountGiven: 0,
        totalRevenueGenerated: 0,
        lastUsedAt: null,
      },
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      save: async function () {
        const idx = mockCoupons.findIndex((c) => c._id.toString() === doc._id.toString());
        doc.updatedAt = new Date();
        if (idx > -1) {
          mockCoupons[idx] = doc;
        } else {
          mockCoupons.push(doc);
        }
        return doc;
      },
    };
    return doc;
  };

  MockCouponModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return (
        mockCoupons.find((c) => {
          if (filter?.code && c.code !== filter.code.toUpperCase()) return false;
          if (filter?._id && filter._id.$ne && c._id.toString() === filter._id.$ne.toString()) return false;
          return true;
        }) || null
      );
    })
  );

  MockCouponModel.findById = vi.fn((id: any) =>
    mockQuery(() => {
      const idStr = id?.toString ? id.toString() : String(id);
      return mockCoupons.find((c) => c._id.toString() === idStr) || null;
    })
  );

  MockCouponModel.find = vi.fn((filter: any) =>
    mockQuery(() => {
      return mockCoupons.filter((c) => {
        if (filter?.isActive !== undefined && c.isActive !== filter.isActive) return false;
        if (filter?.$or && Array.isArray(filter.$or)) {
          return filter.$or.some((clause: any) => {
            if (clause.code && clause.code.test && clause.code.test(c.code)) return true;
            if (clause.description && clause.description.test && clause.description.test(c.description || ""))
              return true;
            return false;
          });
        }
        return true;
      });
    })
  );

  MockCouponModel.countDocuments = vi.fn((filter: any) => {
    return Promise.resolve(
      mockCoupons.filter((c) => {
        if (filter?.isActive !== undefined && c.isActive !== filter.isActive) return false;
        return true;
      }).length
    );
  });

  MockCouponModel.findByIdAndDelete = vi.fn(async (id: any) => {
    const idStr = id?.toString ? id.toString() : String(id);
    const idx = mockCoupons.findIndex((c) => c._id.toString() === idStr);
    if (idx > -1) {
      const deleted = mockCoupons.splice(idx, 1);
      return deleted[0];
    }
    return null;
  });

  return {
    Coupon: MockCouponModel,
  };
});

// 3. Mock CouponUsage Model
vi.mock("../modules/coupon/models/coupon-usage.model", () => {
  const MockCouponUsageModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      appliedAt: data.appliedAt || new Date(),
      status: data.status || "applied",
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        mockCouponUsages.push(doc);
        return doc;
      },
    };
    return doc;
  };

  MockCouponUsageModel.find = vi.fn((filter: any) =>
    mockQuery(() => {
      return mockCouponUsages.filter((u) => {
        if (filter?.couponId && u.couponId.toString() !== filter.couponId.toString()) return false;
        if (filter?.status && u.status !== filter.status) return false;
        return true;
      });
    })
  );

  MockCouponUsageModel.updateOne = vi.fn(async (filter: any, update: any) => {
    const target = mockCouponUsages.find((u) => {
      if (filter?.orderId && u.orderId?.toString() !== filter.orderId.toString()) return false;
      if (filter?.status && u.status !== filter.status) return false;
      return true;
    });
    if (target && update.$set) {
      Object.assign(target, update.$set);
    } else if (target && update.status) {
      target.status = update.status;
      target.revertedAt = update.revertedAt || new Date();
    }
    return { modifiedCount: target ? 1 : 0 };
  });

  return {
    CouponUsage: MockCouponUsageModel,
  };
});

describe("Phase L — Veyora Coupons & Promotions Integration Tests", () => {
  let app: any;
  const jwtSecret = "veyora_jwt_access_secret_super_secure_32chars_min";

  const adminToken = jwt.sign(
    {
      sub: new mongoose.Types.ObjectId().toString(),
      email: "marketing@veyora.internal",
      role: "admin",
      permissions: ["manage:coupons"],
      sessionId: mockAdminSessionId.toString(),
    },
    jwtSecret
  );

  const customerId = new mongoose.Types.ObjectId().toString();
  const customerToken = jwt.sign(
    {
      sub: customerId,
      email: "priya.verma@example.com",
      role: "customer",
      permissions: [],
      sessionId: mockCustomerSessionId.toString(),
    },
    jwtSecret
  );

  beforeEach(() => {
    app = createApp();
    mockCoupons = [];
    mockCouponUsages = [];
  });

  // ==========================================
  // 1. DISCOUNT CALCULATIONS
  // ==========================================
  describe("1. Discount Calculations (Percentage, Cap, and Fixed Amount)", () => {
    it("should accurately calculate percentage discount without cap", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "ATELIER15",
        discountType: "percentage",
        discountValue: 15, // 15%
        minimumOrderAmount: 0,
        maxDiscountAmount: null,
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 1000000),
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "ATELIER15",
          cartTotal: 200,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discountType).toBe("percentage");
      expect(res.body.data.discountValue).toBe(15);
      expect(res.body.data.discountAmount).toBe(30); // 15% of $200 = $30
    });

    it("should enforce maximum discount ceiling on percentage discount", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "FESTIVE50",
        discountType: "percentage",
        discountValue: 50, // 50%
        minimumOrderAmount: 100,
        maxDiscountAmount: 40, // Capped at $40
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 1000000),
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      // Cart total $200: 50% would be $100, but capped at $40
      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "FESTIVE50",
          cartTotal: 200,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.discountAmount).toBe(40);
    });

    it("should accurately calculate fixed amount discount", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "FLAT25",
        discountType: "fixed",
        discountValue: 25, // $25 off
        minimumOrderAmount: 50,
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 1000000),
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "FLAT25",
          cartTotal: 120,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.discountType).toBe("fixed");
      expect(res.body.data.discountAmount).toBe(25);
    });
  });

  // ==========================================
  // 2. MINIMUM ORDER VALIDATION
  // ==========================================
  describe("2. Minimum Order Spend Validation", () => {
    it("should reject coupon when cart total is below minimum spend threshold", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "VIP100",
        discountType: "fixed",
        discountValue: 50,
        minimumOrderAmount: 250, // Requires $250 minimum
        startsAt: new Date(Date.now() - 10000),
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "VIP100",
          cartTotal: 150, // Below $250
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("minimum spend of $250.00");
    });

    it("should accept coupon when cart total meets or exceeds minimum spend threshold", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "VIP100",
        discountType: "fixed",
        discountValue: 50,
        minimumOrderAmount: 250,
        startsAt: new Date(Date.now() - 10000),
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "VIP100",
          cartTotal: 300, // Exceeds $250
        });

      expect(res.status).toBe(200);
      expect(res.body.data.discountAmount).toBe(50);
    });
  });

  // ==========================================
  // 3. EXPIRY & ACTIVATION VALIDATION
  // ==========================================
  describe("3. Expiry and Schedule Validation", () => {
    it("should reject expired coupons with 400 Bad Request", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "SUMMER2025",
        discountType: "percentage",
        discountValue: 20,
        startsAt: new Date(Date.now() - 2000000),
        expiresAt: new Date(Date.now() - 10000), // In the past
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "SUMMER2025",
          cartTotal: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("has expired");
    });

    it("should reject coupons whose startsAt is in the future", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "NEWYEAR2027",
        discountType: "percentage",
        discountValue: 30,
        startsAt: new Date(Date.now() + 500000), // In the future
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "NEWYEAR2027",
          cartTotal: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("not yet active");
    });

    it("should reject deactivated coupons", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "PAUSED10",
        discountType: "percentage",
        discountValue: 10,
        isActive: false, // Inactive
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "PAUSED10",
          cartTotal: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("currently inactive");
    });
  });

  // ==========================================
  // 4. USAGE LIMITS & PER-CUSTOMER RESTRICTIONS
  // ==========================================
  describe("4. Usage Limits and Per-Customer Controls", () => {
    it("should reject coupon when global usage limit is reached", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "LIMITED50",
        discountType: "percentage",
        discountValue: 20,
        usageLimit: 50,
        usageCount: 50, // At limit
        isActive: true,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "LIMITED50",
          cartTotal: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("maximum redemption limit");
    });

    it("should reject coupon when authenticated patron exceeds per-customer limit", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "ONCEONLY",
        discountType: "fixed",
        discountValue: 15,
        perCustomerLimit: 1, // Only 1 redemption allowed per customer
        usageLimit: 1000,
        usageCount: 5,
        isActive: true,
        customerUsage: [
          {
            customerIdOrEmail: customerId, // Customer already used it once
            usageCount: 1,
            lastUsedAt: new Date(),
          },
        ],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          code: "ONCEONLY",
          cartTotal: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("reached the maximum redemption limit");
    });
  });

  // ==========================================
  // 5. PRODUCT & CATEGORY SPECIFIC RULES
  // ==========================================
  describe("5. Product & Category Specific Rules", () => {
    const silkKurtiProductId = new mongoose.Types.ObjectId();
    const cottonShirtProductId = new mongoose.Types.ObjectId();
    const sareesCategoryId = new mongoose.Types.ObjectId();

    it("should only apply discount to eligible items matching applicableProducts", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "SILK30",
        discountType: "percentage",
        discountValue: 30, // 30% off silk kurtis only
        applicableProducts: [silkKurtiProductId],
        applicableCategories: [],
        excludedProducts: [],
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "SILK30",
          items: [
            {
              productId: silkKurtiProductId.toString(),
              price: 200,
              quantity: 1, // $200 eligible
            },
            {
              productId: cottonShirtProductId.toString(),
              price: 100,
              quantity: 1, // $100 ineligible
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.eligibleSubtotal).toBe(200);
      expect(res.body.data.discountAmount).toBe(60); // 30% of $200
    });

    it("should reject coupon when bag contains zero eligible items", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "SAREESONLY",
        discountType: "percentage",
        discountValue: 20,
        applicableProducts: [],
        applicableCategories: [sareesCategoryId],
        excludedProducts: [],
        isActive: true,
        usageCount: 0,
        customerUsage: [],
      });

      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "SAREESONLY",
          items: [
            {
              productId: cottonShirtProductId.toString(),
              categoryId: new mongoose.Types.ObjectId().toString(), // Different category
              price: 100,
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("not applicable to any items");
    });
  });

  // ==========================================
  // 6. INVALID COUPONS
  // ==========================================
  describe("6. Invalid Coupon Code Handling", () => {
    it("should return 404 Not Found for non-existent coupon codes", async () => {
      const res = await request(app)
        .post("/api/v1/coupons/validate")
        .send({
          code: "NONEXISTENT999",
          cartTotal: 100,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("is invalid");
    });
  });

  // ==========================================
  // 7. ADMIN COUPON CRUD & ANALYTICS
  // ==========================================
  describe("7. Administrator Coupon Governance (Admin Endpoints)", () => {
    it("should allow admin to create a new coupon with full rules", async () => {
      const res = await request(app)
        .post("/api/v1/admin/coupons")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "DIWALI2026",
          description: "Exclusive festive privilege discount",
          discountType: "percentage",
          discountValue: 25,
          minimumOrderAmount: 150,
          maxDiscountAmount: 75,
          usageLimit: 500,
          perCustomerLimit: 2,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe("DIWALI2026");
      expect(res.body.data.discountValue).toBe(25);
      expect(res.body.data.minimumOrderAmount).toBe(150);
      expect(res.body.data.maxDiscountAmount).toBe(75);
      expect(res.body.data.status).toBe("active");

      expect(mockCoupons.length).toBe(1);
    });

    it("should reject coupon creation with duplicate code with 409 Conflict", async () => {
      mockCoupons.push({
        _id: new mongoose.Types.ObjectId(),
        code: "DUPLICATE10",
        discountType: "percentage",
        discountValue: 10,
        isActive: true,
      });

      const res = await request(app)
        .post("/api/v1/admin/coupons")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "DUPLICATE10",
          discountType: "percentage",
          discountValue: 10,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already exists");
    });

    it("should allow admin to toggle coupon status (activate/deactivate)", async () => {
      const couponId = new mongoose.Types.ObjectId();
      mockCoupons.push({
        _id: couponId,
        code: "TOGGLEME",
        discountType: "fixed",
        discountValue: 20,
        isActive: true,
        startsAt: new Date(Date.now() - 10000),
        analytics: { totalDiscountGiven: 0, totalRevenueGenerated: 0 },
        save: async function () {
          return this;
        },
      });

      // Toggle from active to inactive
      const res = await request(app)
        .patch(`/api/v1/admin/coupons/${couponId.toString()}/toggle-status`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it("should return detailed coupon analytics and recent redemptions", async () => {
      const couponId = new mongoose.Types.ObjectId();
      mockCoupons.push({
        _id: couponId,
        code: "ANALYTICS10",
        discountType: "percentage",
        discountValue: 10,
        usageLimit: 100,
        usageCount: 15,
        isActive: true,
        startsAt: new Date(Date.now() - 10000),
        analytics: {
          totalDiscountGiven: 450,
          totalRevenueGenerated: 4500,
          lastUsedAt: new Date(),
        },
      });

      mockCouponUsages.push({
        couponId,
        couponCode: "ANALYTICS10",
        orderId: new mongoose.Types.ObjectId(),
        orderNumber: "VYR-101",
        customerEmail: "patron@example.com",
        discountAmount: 30,
        orderTotal: 300,
        status: "applied",
        appliedAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/v1/admin/coupons/${couponId.toString()}/analytics`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.code).toBe("ANALYTICS10");
      expect(res.body.data.usageCount).toBe(15);
      expect(res.body.data.totalDiscountGiven).toBe(450);
      expect(res.body.data.totalRevenueGenerated).toBe(4500);
      expect(res.body.data.averageOrderValue).toBe(300); // 4500 / 15
      expect(res.body.data.recentRedemptions.length).toBe(1);
    });

    it("should reject customer attempts to access admin coupon endpoints with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/v1/admin/coupons")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
