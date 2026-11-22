/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";

let mockOrders: any[] = [];
let mockShipments: any[] = [];
let mockZones: any[] = [];
let mockMethods: any[] = [];

const mockAdminSessionId = new mongoose.Types.ObjectId();
const mockCustomerSessionId = new mongoose.Types.ObjectId();

function mockQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
    lean: vi.fn(() => queryObj),
    select: vi.fn(() => queryObj),
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
vi.mock("../modules/checkout/models/order.model", () => ({
  Order: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      const order = mockOrders.find((o) => o._id.toString() === idStr);
      return Promise.resolve(order || null);
    }),
    find: vi.fn(() => mockQuery(() => [...mockOrders])),
  },
}));

// 3. Mock Shipping Models
vi.mock("../modules/shipping/models/shipping-zone.model", () => {
  const MockZone: any = vi.fn((data: any) => ({
    _id: new mongoose.Types.ObjectId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn(function (this: any) {
      mockZones.push(this);
      return Promise.resolve(this);
    }),
  }));
  MockZone.countDocuments = vi.fn(() => Promise.resolve(mockZones.length));
  MockZone.create = vi.fn((data: any) => {
    const doc = MockZone(data);
    mockZones.push(doc);
    return Promise.resolve(doc);
  });
  MockZone.find = vi.fn(() => mockQuery(() => [...mockZones]));
  MockZone.findOne = vi.fn((filter: any) => {
    let result = mockZones[0] || null;
    if (filter.code) {
      result = mockZones.find((z) => z.code === filter.code) || null;
    }
    return Promise.resolve(result);
  });
  return { ShippingZoneModel: MockZone };
});

vi.mock("../modules/shipping/models/shipping-method.model", () => {
  const MockMethod: any = vi.fn((data: any) => ({
    _id: new mongoose.Types.ObjectId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn(function (this: any) {
      mockMethods.push(this);
      return Promise.resolve(this);
    }),
  }));
  MockMethod.countDocuments = vi.fn(() => Promise.resolve(mockMethods.length));
  MockMethod.create = vi.fn((data: any) => {
    if (Array.isArray(data)) {
      const docs = data.map((d) => MockMethod(d));
      mockMethods.push(...docs);
      return Promise.resolve(docs);
    }
    const doc = MockMethod(data);
    mockMethods.push(doc);
    return Promise.resolve(doc);
  });
  MockMethod.find = vi.fn(() => mockQuery(() => [...mockMethods]));
  MockMethod.findOne = vi.fn(() => Promise.resolve(mockMethods[0] || null));
  return { ShippingMethodModel: MockMethod };
});

vi.mock("../modules/shipping/models/shipment.model", () => {
  const MockShipment: any = vi.fn((data: any) => {
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn(function (this: any) {
        const idx = mockShipments.findIndex((s) => s._id.toString() === this._id.toString());
        if (idx >= 0) {
          mockShipments[idx] = this;
        } else {
          mockShipments.push(this);
        }
        return Promise.resolve(this);
      }),
    };
    return doc;
  });

  MockShipment.create = vi.fn((data: any) => {
    const doc = MockShipment(data);
    mockShipments.push(doc);
    return Promise.resolve(doc);
  });

  MockShipment.findById = vi.fn((id: any) => {
    const idStr = id?.toString ? id.toString() : String(id);
    const shipment = mockShipments.find((s) => s._id.toString() === idStr);
    return Promise.resolve(shipment || null);
  });

  MockShipment.findOne = vi.fn((filter: any) => {
    let results = [...mockShipments];
    if (filter.$or) {
      results = results.filter((s) =>
        filter.$or.some(
          (clause: any) =>
            clause.trackingNumber === s.trackingNumber || clause.shipmentNumber === s.shipmentNumber
        )
      );
    }
    return Promise.resolve(results[0] || null);
  });

  MockShipment.find = vi.fn((filter: any) =>
    mockQuery(() => {
      let results = [...mockShipments];
      if (filter.orderId) {
        results = results.filter((s) => s.orderId.toString() === filter.orderId.toString());
      }
      if (filter.status) {
        results = results.filter((s) => s.status === filter.status);
      }
      if (filter.carrier) {
        results = results.filter((s) => s.carrier === filter.carrier);
      }
      return results;
    })
  );

  MockShipment.countDocuments = vi.fn(() => Promise.resolve(mockShipments.length));

  return { ShipmentModel: MockShipment };
});

const app = createApp();

describe("Phase O — Veyora Shipping & Order Fulfillment Integration Tests", () => {
  let adminToken: string;
  let customerToken: string;
  let orderId: mongoose.Types.ObjectId;
  let orderItemId: string;

  beforeEach(() => {
    mockOrders = [];
    mockShipments = [];
    mockZones = [];
    mockMethods = [];

    const secret = "veyora_jwt_access_secret_super_secure_32chars_min";

    adminToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        email: "logistics.manager@veyora.luxury",
        role: "admin",
        permissions: ["manage:shipping", "manage:orders"],
        sessionId: mockAdminSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    customerToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        email: "client@veyora.luxury",
        role: "customer",
        permissions: [],
        sessionId: mockCustomerSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    orderId = new mongoose.Types.ObjectId();
    orderItemId = "item_12345";

    // Setup an initial mock Order
    const mockOrderDoc = {
      _id: orderId,
      orderNumber: "VEY-2026-99001",
      customerName: "Aarav Singhania",
      customerEmail: "aarav@singhania.in",
      status: "processing",
      shippingMethod: "standard",
      shippingCost: 150,
      subtotal: 5500,
      total: 5650,
      shippingAddress: {
        firstName: "Aarav",
        lastName: "Singhania",
        street: "7 Altamount Road",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400026",
        country: "IN",
        phone: "+919876543210",
      },
      items: [
        {
          id: orderItemId,
          productId: new mongoose.Types.ObjectId(),
          variantId: null,
          title: "Hand-Embroidered Zardozi Sherwani",
          sku: "VEY-ZAR-01",
          price: 5500,
          quantity: 1,
          subtotal: 5500,
          image: "https://cdn.veyora.luxury/sherwani.jpg",
        },
      ],
      statusHistory: [
        {
          fromStatus: "pending",
          toStatus: "processing",
          changedBy: "system",
          role: "system",
          reason: "Payment verified",
          timestamp: new Date(),
        },
      ],
      save: vi.fn(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockOrders.push(mockOrderDoc);
  });

  // 1. RATE CALCULATION TESTS
  describe("POST /api/v1/shipping/calculate-rates", () => {
    it("should calculate standard and express shipping quotes with free threshold eligibility", async () => {
      const res = await request(app).post("/api/v1/shipping/calculate-rates").send({
        destinationPostalCode: "400026",
        destinationCountry: "IN",
        destinationState: "Maharashtra",
        subtotal: 2500, // Above ₹1,999 free threshold
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.zoneName).toBeDefined();
      expect(Array.isArray(res.body.data.quotes)).toBe(true);

      const standardQuote = res.body.data.quotes.find((q: any) => q.code === "standard");
      expect(standardQuote).toBeDefined();
      expect(standardQuote.isFree).toBe(true);
      expect(standardQuote.amount).toBe(0);
    });

    it("should apply standard delivery charge when subtotal is below free shipping threshold", async () => {
      const res = await request(app).post("/api/v1/shipping/calculate-rates").send({
        destinationPostalCode: "400026",
        destinationCountry: "IN",
        destinationState: "Maharashtra",
        subtotal: 999, // Below ₹1,999 free threshold
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const standardQuote = res.body.data.quotes.find((q: any) => q.code === "standard");
      expect(standardQuote).toBeDefined();
      expect(standardQuote.isFree).toBe(false);
      expect(standardQuote.amount).toBeGreaterThan(0);
    });

    it("should reject invalid destination postal codes or negative subtotals", async () => {
      const res = await request(app).post("/api/v1/shipping/calculate-rates").send({
        destinationPostalCode: "A", // too short
        subtotal: -50,
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  // 2. SHIPMENT CREATION TESTS
  describe("POST /api/v1/admin/shipments", () => {
    it("should manifest shipment, generate AWB, and advance order status to shipped", async () => {
      const res = await request(app)
        .post("/api/v1/admin/shipments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          orderId: orderId.toString(),
          carrier: "delhivery",
          shippingMethod: "standard",
          notes: "Atelier inspection passed. Packaged in signature luxury garment chest.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trackingNumber).toBeDefined();
      expect(res.body.data.carrier).toBe("delhivery");
      expect(res.body.data.status).toBe("manifested");
      expect(res.body.data.trackingEvents.length).toBeGreaterThanOrEqual(1);

      // Verify linked order status was updated
      const order = mockOrders[0];
      expect(order.status).toBe("shipped");
      expect(order.tracking.trackingNumber).toBe(res.body.data.trackingNumber);
      expect(order.save).toHaveBeenCalled();
    });

    it("should fail when order does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/v1/admin/shipments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          orderId: nonExistentId.toString(),
          carrier: "bluedart",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should reject fulfillment if order is cancelled", async () => {
      mockOrders[0].status = "cancelled";

      const res = await request(app)
        .post("/api/v1/admin/shipments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          orderId: orderId.toString(),
          carrier: "delhivery",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("cancelled");
    });

    it("should reject fulfillment with non-existent line items", async () => {
      const res = await request(app)
        .post("/api/v1/admin/shipments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          orderId: orderId.toString(),
          items: [{ orderItemId: "invalid_item_id", quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // 3. TRACKING PROGRESSION & DELIVERY TESTS
  describe("PATCH /api/v1/admin/shipments/:id/tracking", () => {
    it("should advance tracking status through lifecycle and mark order delivered", async () => {
      // 1. Create initial shipment
      const createRes = await request(app)
        .post("/api/v1/admin/shipments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          orderId: orderId.toString(),
          carrier: "bluedart",
        });

      const shipmentId = createRes.body.data.id;
      const awb = createRes.body.data.trackingNumber;

      // 2. Advance to in_transit
      const transitRes = await request(app)
        .patch(`/api/v1/admin/shipments/${shipmentId}/tracking`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "in_transit",
          location: "Bandra Kurla Distribution Gateway",
          description: "Package departed sorting hub",
        });

      expect(transitRes.status).toBe(200);
      expect(transitRes.body.data.status).toBe("in_transit");
      expect(transitRes.body.data.trackingEvents.length).toBe(2);

      // 3. Advance to delivered
      const deliverRes = await request(app)
        .patch(`/api/v1/admin/shipments/${shipmentId}/tracking`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "delivered",
          location: "Destination Altamount Residence",
          description: "Delivered to client reception and verified by signature.",
        });

      expect(deliverRes.status).toBe(200);
      expect(deliverRes.body.data.status).toBe("delivered");
      expect(deliverRes.body.data.deliveredAt).toBeDefined();

      // Verify linked order was updated to delivered
      const order = mockOrders[0];
      expect(order.status).toBe("delivered");

      // 4. Public tracking verification
      const trackRes = await request(app).get(`/api/v1/shipping/track/${awb}`);
      expect(trackRes.status).toBe(200);
      expect(trackRes.body.data.status).toBe("delivered");
      expect(trackRes.body.data.trackingEvents.length).toBe(3);
    });
  });

  // 4. ADMIN SHIPMENT LISTING & SECURITY
  describe("Admin Shipment Management & RBAC", () => {
    it("should list all shipments for admin", async () => {
      const res = await request(app)
        .get("/api/v1/admin/shipments")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it("should deny customer access to admin shipment endpoints", async () => {
      const res = await request(app)
        .post("/api/v1/admin/shipments")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: orderId.toString(),
        });

      expect(res.status).toBe(403);
    });

    it("should deny unauthenticated requests to admin shipment endpoints", async () => {
      const res = await request(app).get("/api/v1/admin/shipments");
      expect(res.status).toBe(401);
    });

    it("should allow customer to view order shipments", async () => {
      const res = await request(app).get(`/api/v1/shipping/orders/${orderId.toString()}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
