/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import { env } from "../config/env";

let mockOrders: any[] = [];
let mockProducts: any[] = [];
let mockInventory: any[] = [];
let mockStockMovements: any[] = [];

const mockAdminSessionId = new mongoose.Types.ObjectId();
const mockCustomerSessionId = new mongoose.Types.ObjectId();
const mockOtherSessionId = new mongoose.Types.ObjectId();

function mockQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
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

// Mock Session model for Auth
vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      if (
        idStr === mockAdminSessionId.toString() ||
        idStr === mockCustomerSessionId.toString() ||
        idStr === mockOtherSessionId.toString()
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

// Mock Order
vi.mock("../modules/checkout/models/order.model", () => {
  const MockOrderModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      status: data.status || "pending",
      statusHistory: data.statusHistory || [],
      tracking: data.tracking || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = mockOrders.findIndex((o) => o._id.toString() === doc._id.toString());
        doc.updatedAt = new Date();
        if (idx > -1) {
          mockOrders[idx] = doc;
        } else {
          mockOrders.push(doc);
        }
        return doc;
      },
    };
    return doc;
  };

  MockOrderModel.find = vi.fn((filter: any) =>
    mockQuery(() => {
      return mockOrders.filter((o) => {
        if (filter?.status && o.status !== filter.status) return false;
        if (filter?.userId && (!o.userId || o.userId.toString() !== filter.userId.toString()))
          return false;
        if (filter?.guestId && o.guestId !== filter.guestId) return false;
        if (filter?.$or && Array.isArray(filter.$or)) {
          return filter.$or.some((clause: any) => {
            if (
              clause.orderNumber &&
              clause.orderNumber.test &&
              clause.orderNumber.test(o.orderNumber)
            )
              return true;
            if (
              clause.customerEmail &&
              clause.customerEmail.test &&
              clause.customerEmail.test(o.customerEmail)
            )
              return true;
            if (
              clause.customerName &&
              clause.customerName.test &&
              clause.customerName.test(o.customerName)
            )
              return true;
            return false;
          });
        }
        return true;
      });
    })
  );

  MockOrderModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return (
        mockOrders.find((o) => {
          if (filter?.idempotencyKey && o.idempotencyKey === filter.idempotencyKey) return true;
          if (filter?._id && o._id.toString() === filter._id.toString()) return true;
          if (filter?.orderNumber && o.orderNumber === filter.orderNumber) return true;
          if (filter?.$or && Array.isArray(filter.$or)) {
            return filter.$or.some((sub: any) => {
              if (sub?._id && o._id.toString() === sub._id.toString()) return true;
              if (sub?.orderNumber && o.orderNumber === sub.orderNumber) return true;
              return false;
            });
          }
          return false;
        }) || null
      );
    })
  );

  MockOrderModel.findById = vi.fn((id: any) =>
    mockQuery(() => {
      const idStr = id?.toString ? id.toString() : String(id);
      return mockOrders.find((o) => o._id.toString() === idStr) || null;
    })
  );

  MockOrderModel.countDocuments = vi.fn(async (filter: any) => {
    return mockOrders.filter((o) => {
      if (filter?.status && o.status !== filter.status) return false;
      return true;
    }).length;
  });

  return {
    Order: MockOrderModel,
  };
});

// Mock Inventory
vi.mock("../modules/inventory/models/inventory.model", () => ({
  Inventory: {
    findOne: vi.fn((filter: any) =>
      mockQuery(() => {
        return (
          mockInventory.find((inv) => {
            if (filter?.productId && inv.productId.toString() !== filter.productId.toString()) {
              return false;
            }
            if (filter?.variantId !== undefined) {
              const vId = filter.variantId ? filter.variantId.toString() : null;
              const invVId = inv.variantId ? inv.variantId.toString() : null;
              if (vId !== invVId) return false;
            }
            return true;
          }) || null
        );
      })
    ),
  },
}));

// Mock StockMovement
vi.mock("../modules/inventory/models/stock-movement.model", () => ({
  StockMovement: {
    create: vi.fn(async (data: any) => {
      mockStockMovements.push(data);
      return data;
    }),
  },
}));

// Mock Product
vi.mock("../modules/catalog/models/product.model", () => ({
  Product: {
    findById: vi.fn((id: any) =>
      mockQuery(() => {
        const idStr = id?.toString ? id.toString() : String(id);
        return mockProducts.find((p) => p._id.toString() === idStr) || null;
      })
    ),
  },
}));

describe("Phase J — Order Management & Lifecycle State Machine Integration Tests", () => {
  let app: any;
  const adminSecret = env.JWT_ACCESS_SECRET;

  const adminToken = jwt.sign(
    {
      sub: new mongoose.Types.ObjectId().toString(),
      email: "admin@veyora.internal",
      role: "admin",
      permissions: ["manage:orders"],
      sessionId: mockAdminSessionId.toString(),
    },
    adminSecret
  );

  const customerId = new mongoose.Types.ObjectId().toString();
  const customerToken = jwt.sign(
    {
      sub: customerId,
      email: "priya.sharma@example.com",
      role: "customer",
      permissions: [],
      sessionId: mockCustomerSessionId.toString(),
    },
    adminSecret
  );

  let testOrder: any;
  let testInventory: any;

  beforeEach(() => {
    app = createApp();
    mockOrders = [];
    mockProducts = [];
    mockInventory = [];
    mockStockMovements = [];

    const productId = new mongoose.Types.ObjectId();

    testInventory = {
      _id: new mongoose.Types.ObjectId(),
      productId,
      variantId: null,
      sku: "VYR-SLK-001",
      onHand: 10,
      reserved: 1, // 1 unit reserved for test order
      save: async function () {
        return this;
      },
    };
    mockInventory.push(testInventory);

    testOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "VY-ORD-100200",
      userId: new mongoose.Types.ObjectId(customerId),
      customerEmail: "priya.sharma@example.com",
      customerName: "Priya Sharma",
      items: [
        {
          id: "item-1",
          productId,
          variantId: null,
          title: "Chanderi Silk Anarkali",
          sku: "VYR-SLK-001",
          price: 180,
          quantity: 1,
          subtotal: 180,
        },
      ],
      shippingAddress: {
        firstName: "Priya",
        lastName: "Sharma",
        street: "12 Lavelle Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
      },
      billingAddress: {
        firstName: "Priya",
        lastName: "Sharma",
        street: "12 Lavelle Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
      },
      shippingMethod: "standard",
      shippingCost: 0,
      subtotal: 180,
      discount: 0,
      tax: 14.4,
      total: 194.4,
      status: "pending",
      statusHistory: [
        {
          fromStatus: null,
          toStatus: "pending",
          changedBy: customerId,
          role: "customer",
          reason: "Order placed",
          timestamp: new Date(),
        },
      ],
      tracking: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        return this;
      },
    };
    mockOrders.push(testOrder);
  });

  describe("1. Order Lifecycle State Machine & Valid Transitions", () => {
    it("should allow admin to transition from pending -> confirmed", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder._id.toString()}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "confirmed",
          reason: "Payment verified and order accepted by atelier",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("confirmed");
      expect(res.body.data.statusHistory.length).toBe(2);
      expect(res.body.data.statusHistory[1].toStatus).toBe("confirmed");
    });

    it("should allow admin to advance confirmed -> processing", async () => {
      testOrder.status = "confirmed";

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder._id.toString()}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "processing",
          reason: "Garment cutting & tailoring initiated",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("processing");
    });

    it("should allow admin to advance processing -> shipped with tracking info", async () => {
      testOrder.status = "processing";

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder._id.toString()}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "shipped",
          trackingCarrier: "Bluedart Priority Apex",
          trackingNumber: "BD99281203",
          trackingUrl: "https://track.bluedart.com?no=BD99281203",
          estimatedDeliveryDate: "Nov 25, 2026",
          reason: "Dispatched from Mumbai central fulfillment hub",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("shipped");
      expect(res.body.data.tracking.carrier).toBe("Bluedart Priority Apex");
      expect(res.body.data.tracking.trackingNumber).toBe("BD99281203");
      expect(res.body.data.tracking.shippedAt).toBeDefined();
    });

    it("should allow admin to advance shipped -> delivered", async () => {
      testOrder.status = "shipped";

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder._id.toString()}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "delivered",
          reason: "Recipient signed for luxury courier parcel",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("delivered");
      expect(res.body.data.tracking.deliveredAt).toBeDefined();
    });
  });

  describe("2. Strict Transition Protection (Rejecting Arbitrary Transitions)", () => {
    it("should reject arbitrary jump from pending directly to delivered", async () => {
      testOrder.status = "pending";

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder._id.toString()}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "delivered",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status transition from "pending" to "delivered"');
    });

    it("should reject transitioning from terminal cancelled state", async () => {
      testOrder.status = "cancelled";

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${testOrder._id.toString()}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "processing",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status transition from "cancelled"');
    });
  });

  describe("3. Order Cancellation & Stock Reservation Release", () => {
    it("should allow customer to cancel pending order and release reserved stock", async () => {
      testOrder.status = "pending";
      expect(testInventory.reserved).toBe(1);

      const res = await request(app)
        .post(`/api/v1/orders/${testOrder._id.toString()}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          reason: "Need to update delivery address",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("cancelled");
      expect(res.body.data.cancelReason).toBe("Need to update delivery address");

      // Verify stock reservation was released back
      expect(testInventory.reserved).toBe(0);
      expect(mockStockMovements.length).toBe(1);
      expect(mockStockMovements[0].type).toBe("release");
    });

    it("should forbid customer from cancelling an order once shipped", async () => {
      testOrder.status = "shipped";

      const res = await request(app)
        .post(`/api/v1/orders/${testOrder._id.toString()}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          reason: "Changed mind",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot be cancelled in "shipped" status');
    });
  });

  describe("4. Authorization & Access Control", () => {
    it("should prevent a customer from accessing another customer's order", async () => {
      const otherUserToken = jwt.sign(
        {
          sub: new mongoose.Types.ObjectId().toString(),
          email: "stranger@example.com",
          role: "customer",
          permissions: [],
          sessionId: mockOtherSessionId.toString(),
        },
        adminSecret
      );

      const res = await request(app)
        .get(`/api/v1/orders/${testOrder._id.toString()}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
    });

    it("should deny non-admin access to admin order listing", async () => {
      const res = await request(app)
        .get("/api/v1/admin/orders")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should allow admin to list orders with search and status filters", async () => {
      const res = await request(app)
        .get("/api/v1/admin/orders?status=pending")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.total).toBe(1);
    });
  });
});
