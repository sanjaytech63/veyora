/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import { AnalyticsService } from "../modules/analytics/services/analytics.service";

let mockOrders: any[] = [];
let mockProducts: any[] = [];
let mockInventory: any[] = [];
let mockUsers: any[] = [];

const mockAdminSessionId = new mongoose.Types.ObjectId();
const mockCustomerSessionId = new mongoose.Types.ObjectId();

function mockQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
    lean: vi.fn(() => Promise.resolve(execFn())),
    select: vi.fn(() => Promise.resolve(execFn())),
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

// 1. Mock Session Model
vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      if (idStr === mockAdminSessionId.toString() || idStr === mockCustomerSessionId.toString()) {
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

// 2. Mock Order Model
let mockOrderAggregateImpl: ((pipeline: any[]) => Promise<any[]>) | null = null;
vi.mock("../modules/checkout/models/order.model", () => ({
  Order: {
    aggregate: vi.fn((pipeline: any[]) => {
      if (mockOrderAggregateImpl) {
        return mockOrderAggregateImpl(pipeline);
      }
      return Promise.resolve([]);
    }),
    find: vi.fn(() => mockQuery(() => [...mockOrders])),
    countDocuments: vi.fn((filter: any) => {
      let results = [...mockOrders];
      if (filter?.createdAt?.$gte) {
        results = results.filter((o) => new Date(o.createdAt) >= new Date(filter.createdAt.$gte));
      }
      if (filter?.createdAt?.$lte) {
        results = results.filter((o) => new Date(o.createdAt) <= new Date(filter.createdAt.$lte));
      }
      return Promise.resolve(results.length);
    }),
  },
}));

// 3. Mock Product Model
vi.mock("../modules/catalog/models/product.model", () => ({
  Product: {
    countDocuments: vi.fn((filter?: any) => {
      let results = [...mockProducts];
      if (filter?.status) {
        results = results.filter((p) => p.status === filter.status);
      }
      return Promise.resolve(results.length);
    }),
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      const prod = mockProducts.find((p) => p._id?.toString() === idStr) || {
        _id: id,
        stock: 12,
        title: "Garment",
      };
      return mockQuery(() => prod);
    }),
    aggregate: vi.fn(() => Promise.resolve([{ totalStock: 0 }])),
    find: vi.fn(() => mockQuery(() => [...mockProducts])),
  },
}));

// 4. Mock Inventory Model
let mockInventoryAggregateImpl: ((pipeline: any[]) => Promise<any[]>) | null = null;
vi.mock("../modules/inventory/models/inventory.model", () => ({
  Inventory: {
    aggregate: vi.fn((pipeline: any[]) => {
      if (mockInventoryAggregateImpl) {
        return mockInventoryAggregateImpl(pipeline);
      }
      return Promise.resolve([]);
    }),
    find: vi.fn(() => mockQuery(() => [...mockInventory])),
    countDocuments: vi.fn((filter?: any) => {
      if (filter?.available === 0) return Promise.resolve(2);
      if (filter?.$expr) return Promise.resolve(3);
      return Promise.resolve(mockInventory.length);
    }),
  },
}));

// 5. Mock User Model
let mockUserAggregateImpl: ((pipeline: any[]) => Promise<any[]>) | null = null;
vi.mock("../modules/auth/models/user.model", () => ({
  User: {
    countDocuments: vi.fn((filter?: any) => {
      let results = [...mockUsers];
      if (filter?.role) {
        results = results.filter((u) => u.role === filter.role);
      }
      if (filter?.createdAt?.$gte) {
        results = results.filter((u) => new Date(u.createdAt) >= new Date(filter.createdAt.$gte));
      }
      if (filter?.createdAt?.$lte) {
        results = results.filter((u) => new Date(u.createdAt) <= new Date(filter.createdAt.$lte));
      }
      return Promise.resolve(results.length);
    }),
    aggregate: vi.fn((pipeline: any[]) => {
      if (mockUserAggregateImpl) {
        return mockUserAggregateImpl(pipeline);
      }
      return Promise.resolve([]);
    }),
    find: vi.fn(() => mockQuery(() => [...mockUsers])),
  },
}));

const app = createApp();

describe("Phase Q — Veyora Admin Dashboard & Analytics", () => {
  let adminToken: string;
  let superadminToken: string;
  let customerToken: string;
  const analyticsService = new AnalyticsService();

  beforeEach(() => {
    mockOrders = [];
    mockProducts = [];
    mockInventory = [];
    mockUsers = [];
    mockOrderAggregateImpl = null;
    mockInventoryAggregateImpl = null;
    mockUserAggregateImpl = null;

    const secret = "veyora_jwt_access_secret_super_secure_32chars_min";

    adminToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        email: "executive@veyora.luxury",
        role: "admin",
        permissions: ["read:analytics", "manage:dashboard"],
        sessionId: mockAdminSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    superadminToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        email: "founder@veyora.luxury",
        role: "superadmin",
        permissions: ["*"],
        sessionId: mockAdminSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    customerToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        email: "patron@gmail.com",
        role: "customer",
        permissions: [],
        sessionId: mockCustomerSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );
  });

  describe("1. Date Range Resolution & Growth Computation", () => {
    it("should resolve default 30d period when no filter provided", () => {
      const range = analyticsService.resolveDateRange({});
      expect(range.period).toBe("30d");
      const diffDays = Math.round(
        (range.end.getTime() - range.start.getTime()) / (24 * 3600 * 1000)
      );
      expect(diffDays).toBe(30);

      // Prior period should match exact duration
      const priorDiff = Math.round(
        (range.priorEnd.getTime() - range.priorStart.getTime()) / (24 * 3600 * 1000)
      );
      expect(priorDiff).toBe(30);
      expect(range.priorEnd.getTime()).toBe(range.start.getTime());
    });

    it("should resolve 7d, today, 90d, 12m, and ytd periods accurately", () => {
      const r7d = analyticsService.resolveDateRange({ period: "7d" });
      expect(r7d.period).toBe("7d");
      const diff7 = Math.round((r7d.end.getTime() - r7d.start.getTime()) / (24 * 3600 * 1000));
      expect(diff7).toBe(7);

      const r90d = analyticsService.resolveDateRange({ period: "90d" });
      expect(r90d.period).toBe("90d");
      const diff90 = Math.round((r90d.end.getTime() - r90d.start.getTime()) / (24 * 3600 * 1000));
      expect(diff90).toBe(90);

      const rToday = analyticsService.resolveDateRange({ period: "today" });
      expect(rToday.period).toBe("today");
      expect(rToday.start.getHours()).toBe(0);
      expect(rToday.start.getMinutes()).toBe(0);

      const rYtd = analyticsService.resolveDateRange({ period: "ytd" });
      expect(rYtd.period).toBe("ytd");
      expect(rYtd.start.getMonth()).toBe(0);
      expect(rYtd.start.getDate()).toBe(1);
    });

    it("should handle custom date range and auto-correct inverted dates", () => {
      const d1 = new Date("2026-05-15T00:00:00.000Z");
      const d2 = new Date("2026-05-01T00:00:00.000Z");

      // Inverted: startDate is after endDate
      const range = analyticsService.resolveDateRange({
        period: "custom",
        startDate: d1.toISOString(),
        endDate: d2.toISOString(),
      });

      expect(range.start.getTime()).toBeLessThan(range.end.getTime());
      expect(range.start.toISOString()).toBe(d2.toISOString());
      expect(range.end.toISOString()).toBe(d1.toISOString());
    });
  });

  describe("2. Revenue Overview Unit & Aggregation Tests", () => {
    it("should compute gross revenue, growth rate, net revenue, and average order value", async () => {
      mockOrderAggregateImpl = vi.fn().mockImplementation((pipeline: any[]) => {
        // Distinguish pipeline based on date match or group stage
        const matchStage = pipeline.find((s) => s.$match);
        if (matchStage && matchStage.$match.status === "refunded") {
          return Promise.resolve([{ _id: null, refundedTotal: 500 }]);
        }
        const hasSort = pipeline.some((s) => s.$sort);
        const hasGroup = pipeline.some((s) => s.$group);
        if (hasSort && hasGroup) {
          // Timeline aggregation
          return Promise.resolve([
            { _id: "2026-05-01", revenue: 1000, orders: 2 },
            { _id: "2026-05-02", revenue: 2000, orders: 3 },
          ]);
        }
        // Current and prior aggregates
        return Promise.resolve([
          {
            _id: null,
            totalRevenue: 5000,
            subtotalSum: 5200,
            discountTotal: 200,
            orderCount: 5,
          },
        ]);
      });

      const res = await analyticsService.getRevenueOverview({ period: "30d" });

      expect(res.totalRevenue).toBe(5000);
      expect(res.netRevenue).toBe(4500); // 5000 - 500 refunded
      expect(res.averageOrderValue).toBe(1000);
      expect(res.discountTotal).toBe(200);
      expect(res.refundedTotal).toBe(500);
      expect(res.timeline.length).toBe(2);
      expect(res.timeline[0]?.revenue).toBe(1000);
    });
  });

  describe("3. Orders Overview Aggregation Tests", () => {
    it("should compute total orders, cancellation rate, and status distribution", async () => {
      mockOrders = new Array(25).fill({ createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000) });

      mockOrderAggregateImpl = vi.fn().mockImplementation((pipeline: any[]) => {
        // Status distribution aggregation
        if (pipeline.some((s) => s.$group && s.$group._id === "$status")) {
          return Promise.resolve([
            { _id: "delivered", count: 20, revenue: 25000 },
            { _id: "processing", count: 10, revenue: 12000 },
            { _id: "cancelled", count: 5, revenue: 4000 },
          ]);
        }
        // Timeline aggregation
        const hasSort = pipeline.some((s) => s.$sort);
        const hasGroup = pipeline.some((s) => s.$group);
        if (hasSort && hasGroup) {
          return Promise.resolve([
            { _id: "2026-05-01", totalOrders: 15, completedOrders: 10, cancelledOrders: 2 },
            { _id: "2026-05-02", totalOrders: 20, completedOrders: 15, cancelledOrders: 3 },
          ]);
        }
        return Promise.resolve([]);
      });

      const res = await analyticsService.getOrdersOverview({ period: "30d" });

      expect(res.totalOrders).toBe(35);
      expect(res.cancellationRate).toBe(14.3); // (5 / 35) * 100 rounded
      expect(res.statusDistribution.length).toBe(3);
      expect(res.timeline.length).toBe(2);
      expect(res.previousPeriodOrders).toBe(25);
    });
  });

  describe("4. Customers Overview Aggregation Tests", () => {
    it("should compute customer acquisition, repeat purchase rate, and VIP patrons", async () => {
      mockUsers = [
        { _id: new mongoose.Types.ObjectId(), role: "customer", createdAt: new Date() },
        { _id: new mongoose.Types.ObjectId(), role: "customer", createdAt: new Date() },
        { _id: new mongoose.Types.ObjectId(), role: "customer", createdAt: new Date() },
      ];

      mockOrderAggregateImpl = vi.fn().mockImplementation((pipeline: any[]) => {
        // Repeat customer aggregation ($group by userId)
        if (pipeline.some((s) => s.$group && s.$group._id === "$userId")) {
          return Promise.resolve([
            {
              _id: new mongoose.Types.ObjectId(),
              name: "Eleanor Vance",
              email: "eleanor@vance.com",
              orderCount: 5,
              totalSpent: 12500,
            },
            {
              _id: new mongoose.Types.ObjectId(),
              name: "Arthur Pendelton",
              email: "arthur@pendelton.com",
              orderCount: 1,
              totalSpent: 2200,
            },
          ]);
        }
        return Promise.resolve([]);
      });

      mockUserAggregateImpl = vi.fn().mockImplementation(() => {
        return Promise.resolve([{ _id: "2026-05-01", newCustomers: 3 }]);
      });

      const res = await analyticsService.getCustomersOverview({ period: "30d" });

      expect(res.totalCustomers).toBe(3);
      expect(res.activeOrderingCustomers).toBe(2);
      expect(res.repeatCustomers).toBe(1);
      expect(res.repeatCustomerRate).toBe(50); // 1 repeat out of 2 active = 50%
      expect(res.topCustomers.length).toBe(2);
      expect(res.topCustomers[0]?.name).toBe("Eleanor Vance");
      expect(res.topCustomers[0]?.totalSpent).toBe(12500);
      expect(res.acquisitionTimeline.length).toBe(1);
    });
  });

  describe("5. Products & Inventory Performance Tests", () => {
    it("should rank top selling garments and correlate live inventory", async () => {
      const prodId = new mongoose.Types.ObjectId();
      mockProducts = [
        { _id: prodId, status: "active", stock: 12 },
        { _id: new mongoose.Types.ObjectId(), status: "active", stock: 5 },
      ];

      mockOrderAggregateImpl = vi.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            _id: prodId,
            title: "Silk Velvet Smoking Jacket",
            sku: "VY-JKT-001",
            price: 1500,
            unitsSold: 25,
            totalRevenue: 37500,
            image: "https://cdn.veyora.luxury/jkt.jpg",
          },
        ]);
      });

      mockInventoryAggregateImpl = vi.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            _id: prodId,
            stock: 12,
          },
        ]);
      });

      const res = await analyticsService.getProductsOverview({ period: "30d" });

      expect(res.activeProducts).toBe(2);
      expect(res.topSelling.length).toBe(1);
      expect(res.topSelling[0]?.title).toBe("Silk Velvet Smoking Jacket");
      expect(res.topSelling[0]?.unitsSold).toBe(25);
      expect(res.topSelling[0]?.currentStock).toBe(12);
    });

    it("should return inventory health summary and critical depletion alerts", async () => {
      mockInventory = [
        {
          _id: new mongoose.Types.ObjectId(),
          productId: new mongoose.Types.ObjectId(),
          productTitle: "Cashmere Overcoat",
          sku: "VY-OVC-009",
          onHand: 3,
          reserved: 1,
          available: 2,
          lowStockThreshold: 5,
        },
      ];

      mockInventoryAggregateImpl = vi.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            _id: null,
            totalOnHand: 500,
            totalAvailable: 450,
            totalReserved: 50,
          },
        ]);
      });

      const res = await analyticsService.getInventoryOverview();

      expect(res.totalInventoryUnits).toBe(500);
      expect(res.availableUnits).toBe(450);
      expect(res.reservedUnits).toBe(50);
      expect(res.outOfStockCount).toBe(2);
      expect(res.lowStockCount).toBe(3);
      expect(res.lowStockAlerts.length).toBe(1);
      expect(res.lowStockAlerts[0]?.productTitle).toBe("Cashmere Overcoat");
      expect(res.lowStockAlerts[0]?.available).toBe(2);
    });
  });

  describe("6. Authorization & RBAC Permissions on Analytics Routes", () => {
    it("should reject unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/v1/admin/analytics/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject customer role with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/v1/admin/analytics/dashboard")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow admin role access to comprehensive dashboard with valid schema", async () => {
      mockOrderAggregateImpl = vi.fn().mockImplementation(() => Promise.resolve([]));
      mockInventoryAggregateImpl = vi.fn().mockImplementation(() => Promise.resolve([]));
      mockUserAggregateImpl = vi.fn().mockImplementation(() => Promise.resolve([]));

      const res = await request(app)
        .get("/api/v1/admin/analytics/dashboard?period=7d")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("revenue");
      expect(res.body.data).toHaveProperty("orders");
      expect(res.body.data).toHaveProperty("customers");
      expect(res.body.data).toHaveProperty("products");
      expect(res.body.data).toHaveProperty("inventory");
      expect(res.body.data).toHaveProperty("recentOrders");
    });

    it("should allow superadmin role access to deep-dive analytics routes", async () => {
      mockOrderAggregateImpl = vi.fn().mockImplementation(() => Promise.resolve([]));

      const res = await request(app)
        .get("/api/v1/admin/analytics/revenue?period=30d")
        .set("Authorization", `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("totalRevenue");
      expect(res.body.data).toHaveProperty("revenueGrowthRate");
    });

    it("should validate query parameters and reject invalid period", async () => {
      const res = await request(app)
        .get("/api/v1/admin/analytics/revenue?period=invalid_period_name")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });
});
