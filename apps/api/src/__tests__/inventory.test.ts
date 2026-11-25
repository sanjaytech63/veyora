/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import { env } from "../config/env";
import { ApiInventoryCode } from "@veyora/types";

interface MockInventoryDoc {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productTitle: string;
  variantId?: mongoose.Types.ObjectId | null;
  variantName?: string;
  sku: string;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  trackQuantity: boolean;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<MockInventoryDoc>;
}

interface MockMovementDoc {
  _id: mongoose.Types.ObjectId;
  inventoryId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId | null;
  sku: string;
  type: string;
  quantity: number;
  previousOnHand: number;
  newOnHand: number;
  previousReserved: number;
  newReserved: number;
  reason: string;
  referenceId?: string;
  note?: string;
  userId?: mongoose.Types.ObjectId | null;
  userName?: string;
  createdAt: Date;
}

let mockInventory: MockInventoryDoc[] = [];
let mockMovements: any[] = [];

function makeInventoryDoc(data: Partial<MockInventoryDoc>): MockInventoryDoc {
  const onHand = data.onHand ?? 0;
  const reserved = data.reserved ?? 0;
  const threshold = data.lowStockThreshold ?? 5;
  const available = Math.max(0, onHand - reserved);
  let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
  if (available <= 0) status = "out_of_stock";
  else if (available <= threshold) status = "low_stock";

  const doc: MockInventoryDoc = {
    _id: data._id || new mongoose.Types.ObjectId(),
    productId: data.productId || new mongoose.Types.ObjectId(),
    productTitle: data.productTitle || "Sample Product",
    variantId: data.variantId || null,
    variantName: data.variantName,
    sku: data.sku || "TEST-SKU-001",
    onHand,
    reserved,
    lowStockThreshold: threshold,
    status,
    trackQuantity: data.trackQuantity ?? true,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    save: async function () {
      const avail = Math.max(0, this.onHand - this.reserved);
      if (avail <= 0) this.status = "out_of_stock";
      else if (avail <= this.lowStockThreshold) this.status = "low_stock";
      else this.status = "in_stock";
      this.updatedAt = new Date();
      return this;
    },
  };
  return doc;
}

function makeMovementDoc(data: Partial<MockMovementDoc>): MockMovementDoc {
  return {
    _id: data._id || new mongoose.Types.ObjectId(),
    inventoryId: data.inventoryId || new mongoose.Types.ObjectId(),
    productId: data.productId || new mongoose.Types.ObjectId(),
    variantId: data.variantId || null,
    sku: data.sku || "TEST-SKU-001",
    type: data.type || "adjustment",
    quantity: data.quantity ?? 0,
    previousOnHand: data.previousOnHand ?? 0,
    newOnHand: data.newOnHand ?? 0,
    previousReserved: data.previousReserved ?? 0,
    newReserved: data.newReserved ?? 0,
    reason: data.reason || "Manual update",
    referenceId: data.referenceId,
    note: data.note,
    userId: data.userId || null,
    userName: data.userName,
    createdAt: data.createdAt || new Date(),
  };
}

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

// Mock Inventory Model
vi.mock("../modules/inventory/models/inventory.model", () => ({
  Inventory: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let items = [...mockInventory];
        if (filter?.status) {
          if (filter.status.$in) {
            items = items.filter((i) => filter.status.$in.includes(i.status));
          } else {
            items = items.filter((i) => i.status === filter.status);
          }
        }
        if (filter?.$or) {
          const search = (filter.$or[0]?.sku?.$regex || "").toLowerCase();
          items = items.filter(
            (i) =>
              i.sku.toLowerCase().includes(search) || i.productTitle.toLowerCase().includes(search)
          );
        }
        return items;
      })
    ),
    findOne: vi.fn((query: any) =>
      mockQuery(() => {
        return (
          mockInventory.find((i) => {
            if (query?.sku && i.sku !== query.sku) return false;
            if (query?._id && i._id.toString() !== query._id.toString()) return false;
            if (query?.$or) {
              const matched = query.$or.some((c: any) => {
                if (c._id && i._id.toString() === c._id.toString()) return true;
                if (c.sku && i.sku === c.sku) return true;
                return false;
              });
              if (!matched) return false;
            }
            return true;
          }) || null
        );
      })
    ),
    findById: vi.fn((id: any) =>
      mockQuery(() => {
        const idStr = id?.toString ? id.toString() : String(id);
        return mockInventory.find((i) => i._id.toString() === idStr) || null;
      })
    ),
    create: vi.fn(async (data: any) => {
      const doc = makeInventoryDoc(data);
      mockInventory.push(doc);
      return doc;
    }),
    countDocuments: vi.fn(async (filter: any) => {
      if (filter?.status) {
        if (filter.status.$in) {
          return mockInventory.filter((i) => filter.status.$in.includes(i.status)).length;
        }
        return mockInventory.filter((i) => i.status === filter.status).length;
      }
      return mockInventory.length;
    }),
    aggregate: vi.fn(async () => {
      const totalOnHand = mockInventory.reduce((acc, i) => acc + i.onHand, 0);
      const totalReserved = mockInventory.reduce((acc, i) => acc + i.reserved, 0);
      return [{ totalUnitsOnHand: totalOnHand, totalUnitsReserved: totalReserved }];
    }),
  },
}));

// Mock StockMovement Model
vi.mock("../modules/inventory/models/stock-movement.model", () => ({
  StockMovement: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let items = [...mockMovements];
        if (filter?.sku) items = items.filter((m) => m.sku === filter.sku);
        if (filter?.inventoryId)
          items = items.filter((m) => m.inventoryId.toString() === filter.inventoryId.toString());
        return items;
      })
    ),
    countDocuments: vi.fn(async (filter: any) => {
      let items = [...mockMovements];
      if (filter?.sku) items = items.filter((m) => m.sku === filter.sku);
      if (filter?.inventoryId)
        items = items.filter((m) => m.inventoryId.toString() === filter.inventoryId.toString());
      return items.length;
    }),
    create: vi.fn(async (data: any) => {
      const doc = makeMovementDoc(data);
      mockMovements.push(doc);
      return doc;
    }),
  },
}));

// Mock Product Model for sync
vi.mock("../modules/catalog/models/product.model", () => ({
  Product: {
    findById: vi.fn(async () => ({
      _id: new mongoose.Types.ObjectId(),
      stock: 10,
      variants: [],
      save: async () => {},
    })),
    findOne: vi.fn(async () => ({
      _id: new mongoose.Types.ObjectId(),
      title: "Sample Headset",
      trackQuantity: true,
      variants: [],
    })),
  },
}));

// Mock Session model for Auth
const mockSessionId = new mongoose.Types.ObjectId();
vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    findById: vi.fn(async (id: any) => {
      if (id?.toString() === mockSessionId.toString()) {
        return {
          _id: mockSessionId,
          isRevoked: false,
          expiresAt: new Date(Date.now() + 86400000),
        };
      }
      return null;
    }),
  },
}));

function createTestToken(role: "customer" | "admin" | "superadmin" = "admin"): string {
  return jwt.sign(
    {
      sub: new mongoose.Types.ObjectId().toString(),
      email: `${role}@veyora.test`,
      role,
      permissions: role === "superadmin" ? ["*"] : role === "admin" ? ["inventory:manage"] : [],
      sessionId: mockSessionId.toString(),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Inventory Module Integration Tests", () => {
  const app = createApp();
  let adminToken: string;
  let customerToken: string;

  beforeEach(() => {
    mockInventory = [];
    mockMovements = [];

    adminToken = createTestToken("admin");
    customerToken = createTestToken("customer");

    const item1 = makeInventoryDoc({
      sku: "KEYBOARD-RGB-01",
      productTitle: "Mechanical Gaming Keyboard",
      onHand: 20,
      reserved: 2,
      lowStockThreshold: 5,
    });

    const item2 = makeInventoryDoc({
      sku: "MOUSE-WIRELESS-01",
      productTitle: "Wireless Gaming Mouse",
      onHand: 4,
      reserved: 1,
      lowStockThreshold: 5,
    });

    const item3 = makeInventoryDoc({
      sku: "MOUSEPAD-XL-01",
      productTitle: "Desk Mousepad XL",
      onHand: 0,
      reserved: 0,
      lowStockThreshold: 5,
    });

    mockInventory.push(item1, item2, item3);
  });

  // 1. Authorization & Security
  describe("Security & Access Control", () => {
    it("should reject unauthenticated requests to inventory endpoints with 401", async () => {
      const res = await request(app).get("/api/v1/admin/inventory");
      expect(res.status).toBe(401);
    });

    it("should reject requests from customer accounts with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/v1/admin/inventory")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it("should allow administrators to access inventory endpoints", async () => {
      const res = await request(app)
        .get("/api/v1/admin/inventory")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_ITEMS_FETCHED);
      expect(res.body.data.length).toBe(3);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.requestId).toBeDefined();
    });
  });

  // 2. Stock Adjustments (Increase, Decrease, Correction)
  describe("Stock Adjustments & Movements", () => {
    it("should increase stock (restock) and record movement audit log", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/adjust")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          type: "increase",
          quantity: 15,
          reason: "Purchase order delivery PO-1029",
          note: "Warehouse rack B-12",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_ADJUSTED);
      expect(res.body.data.onHand).toBe(35);
      expect(res.body.data.available).toBe(33); // 35 onHand - 2 reserved

      // Check movement history
      expect(mockMovements.length).toBe(1);
      expect(mockMovements[0].type).toBe("restock");
      expect(mockMovements[0].quantity).toBe(15);
      expect(mockMovements[0].previousOnHand).toBe(20);
      expect(mockMovements[0].newOnHand).toBe(35);
      expect(mockMovements[0].reason).toContain("PO-1029");
    });

    it("should decrease stock and record adjustment audit log", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/adjust")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          type: "decrease",
          quantity: 5,
          reason: "Damaged in transit",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.onHand).toBe(15);
      expect(res.body.data.available).toBe(13); // 15 - 2
    });

    it("should prevent negative stock when decreasing by more than available quantity", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/adjust")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          type: "decrease",
          quantity: 100, // onHand is 20, reserved is 2 -> available is 18
          reason: "Bulk writeoff",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_INSUFFICIENT_STOCK);
      expect(res.body.error.message).toContain("Cannot decrease stock");
    });

    it("should perform physical stock correction to reconcile counts", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/adjust")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          type: "correction",
          quantity: 25,
          reason: "Quarterly stock audit count",
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_ADJUSTED);
      expect(res.body.data.onHand).toBe(25);
      expect(mockMovements[0].type).toBe("correction");
      expect(mockMovements[0].quantity).toBe(5); // 25 - 20
    });

    it("should reject correction lower than currently reserved units", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/adjust")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          type: "correction",
          quantity: 1, // reserved is 2
          reason: "Invalid recount",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_ADJUSTMENT_INVALID);
      expect(res.body.error.message).toContain("cannot be lower than currently reserved");
    });
  });

  // 3. Stock Reservations
  describe("Stock Reservation Foundation", () => {
    it("should reserve stock units and reduce available stock", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/reserve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          quantity: 5,
          referenceId: "CART-SESSION-4881",
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_RESERVED);
      expect(res.body.data.reserved).toBe(7); // 2 + 5
      expect(res.body.data.available).toBe(13); // 20 - 7
      expect(mockMovements[0].type).toBe("reservation");
    });

    it("should reject reservation when requested quantity exceeds available stock", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/reserve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "MOUSE-WIRELESS-01",
          quantity: 10, // available is 3 (4 onHand - 1 reserved)
          referenceId: "ORDER-OVERFLOW",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_INSUFFICIENT_STOCK);
      expect(res.body.error.message).toContain("Insufficient available stock");
    });

    it("should release reserved stock back into available pool", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/release")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          quantity: 2,
          referenceId: "EXPIRED-CART-01",
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_RELEASED);
      expect(res.body.data.reserved).toBe(0); // 2 - 2
      expect(res.body.data.available).toBe(20);
      expect(mockMovements[0].type).toBe("reservation_release");
    });

    it("should commit reservation deducting both on-hand and reserved units", async () => {
      const res = await request(app)
        .post("/api/v1/admin/inventory/commit")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          quantity: 2,
          referenceId: "PAID-ORDER-8820",
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_COMMITTED);
      expect(res.body.data.onHand).toBe(18); // 20 - 2
      expect(res.body.data.reserved).toBe(0); // 2 - 2
      expect(res.body.data.available).toBe(18);
      expect(mockMovements[0].type).toBe("reservation_commit");
    });
  });

  // 4. Low Stock View, Thresholds & Stats
  describe("Low Stock & Inventory Metrics", () => {
    it("should accurately return inventory summary stats", async () => {
      const res = await request(app)
        .get("/api/v1/admin/inventory/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_STATS_FETCHED);
      expect(res.body.data.totalTrackedItems).toBe(3);
      expect(res.body.data.totalUnitsOnHand).toBe(24); // 20 + 4 + 0
      expect(res.body.data.totalUnitsReserved).toBe(3); // 2 + 1 + 0
    });

    it("should filter low stock and out of stock items", async () => {
      const res = await request(app)
        .get("/api/v1/admin/inventory/low-stock")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_LOW_STOCK_FETCHED);
      expect(res.body.data.length).toBe(2); // MOUSE-WIRELESS-01 (available 3 <= 5) and MOUSEPAD-XL-01 (available 0)
    });

    it("should update low stock threshold and recalibrate status", async () => {
      const res = await request(app)
        .patch("/api/v1/admin/inventory/KEYBOARD-RGB-01/threshold")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ lowStockThreshold: 25 }); // onHand is 20, so now low_stock!

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_THRESHOLD_UPDATED);
      expect(res.body.data.lowStockThreshold).toBe(25);
      expect(res.body.data.status).toBe("low_stock");
    });

    it("should retrieve chronological stock movement ledger", async () => {
      // First make an adjustment
      await request(app)
        .post("/api/v1/admin/inventory/adjust")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sku: "KEYBOARD-RGB-01",
          type: "increase",
          quantity: 10,
          reason: "Shipment A",
        });

      const res = await request(app)
        .get("/api/v1/admin/inventory/KEYBOARD-RGB-01/movements")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_MOVEMENTS_FETCHED);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].reason).toBe("Shipment A");
      expect(res.body.data[0].sku).toBe("KEYBOARD-RGB-01");
    });

    it("should return 404 with INVENTORY_ITEM_NOT_FOUND when querying non-existent SKU", async () => {
      const res = await request(app)
        .get("/api/v1/admin/inventory/NON-EXISTENT-SKU")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ApiInventoryCode.INVENTORY_ITEM_NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });
});
