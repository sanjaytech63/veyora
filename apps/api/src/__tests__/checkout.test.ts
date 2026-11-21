/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../app";

// In-memory data store for tests
let mockProducts: any[] = [];
let mockCarts: any[] = [];
let mockInventory: any[] = [];
let mockAddresses: any[] = [];
let mockOrders: any[] = [];
let mockStockMovements: any[] = [];

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

// Mock Product
vi.mock("../modules/catalog/models/product.model", () => ({
  Product: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let items = [...mockProducts];
        if (filter?._id?.$in) {
          const ids = filter._id.$in.map((id: any) => id.toString());
          items = items.filter((p) => ids.includes(p._id.toString()));
        }
        return items;
      })
    ),
    findById: vi.fn((id: any) =>
      mockQuery(() => {
        const idStr = id?.toString ? id.toString() : String(id);
        return mockProducts.find((p) => p._id.toString() === idStr) || null;
      })
    ),
  },
}));

// Mock Inventory
vi.mock("../modules/inventory/models/inventory.model", () => ({
  Inventory: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let items = [...mockInventory];
        if (filter?.productId?.$in) {
          const ids = filter.productId.$in.map((id: any) => id.toString());
          items = items.filter((inv) => ids.includes(inv.productId.toString()));
        }
        return items;
      })
    ),
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
vi.mock("../modules/inventory/models/stock-movement.model", () => {
  const MockStockMovement: any = function (data: any) {
    const doc = { ...data, _id: new mongoose.Types.ObjectId(), createdAt: new Date() };
    return {
      ...doc,
      save: async () => {
        mockStockMovements.push(doc);
        return doc;
      },
    };
  };

  MockStockMovement.create = vi.fn(async (data: any) => {
    const doc = { ...data, _id: new mongoose.Types.ObjectId(), createdAt: new Date() };
    mockStockMovements.push(doc);
    return doc;
  });

  return {
    StockMovement: MockStockMovement,
  };
});

// Mock Cart
vi.mock("../modules/cart/models/cart.model", () => {
  const MockCartModel: any = function (data: any) {
    const doc: any = {
      _id: data._id || new mongoose.Types.ObjectId(),
      userId: data.userId || null,
      guestId: data.guestId || null,
      items: data.items || [],
      couponCode: data.couponCode || null,
      discountPercent: data.discountPercent || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = mockCarts.findIndex((c) => c._id.toString() === doc._id.toString());
        doc.updatedAt = new Date();
        if (idx > -1) {
          mockCarts[idx] = doc;
        } else {
          mockCarts.push(doc);
        }
        return doc;
      },
    };
    return doc;
  };

  MockCartModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return (
        mockCarts.find((c) => {
          if (filter?.userId && c.userId && c.userId.toString() === filter.userId.toString()) {
            return true;
          }
          if (filter?.guestId && c.guestId === filter.guestId) {
            return true;
          }
          return false;
        }) || null
      );
    })
  );

  return {
    Cart: MockCartModel,
  };
});

// Mock Address
vi.mock("../modules/checkout/models/address.model", () => {
  const MockAddressModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = mockAddresses.findIndex((a) => a._id.toString() === doc._id.toString());
        doc.updatedAt = new Date();
        if (idx > -1) {
          mockAddresses[idx] = doc;
        } else {
          mockAddresses.push(doc);
        }
        return doc;
      },
    };
    return doc;
  };

  MockAddressModel.find = vi.fn((filter: any) =>
    mockQuery(() => {
      return mockAddresses.filter((a) => {
        if (filter?.userId && (!a.userId || a.userId.toString() !== filter.userId.toString())) return false;
        if (filter?.guestId && a.guestId !== filter.guestId) return false;
        return true;
      });
    })
  );

  MockAddressModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return (
        mockAddresses.find((a) => {
          if (filter?._id && a._id.toString() !== filter._id.toString()) return false;
          if (filter?.userId && (!a.userId || a.userId.toString() !== filter.userId.toString())) return false;
          if (filter?.guestId && a.guestId !== filter.guestId) return false;
          return true;
        }) || null
      );
    })
  );

  MockAddressModel.findById = vi.fn((id: any) =>
    mockQuery(() => {
      const idStr = id?.toString ? id.toString() : String(id);
      return mockAddresses.find((a) => a._id.toString() === idStr) || null;
    })
  );

  MockAddressModel.deleteOne = vi.fn(async (filter: any) => {
    const idStr = filter?._id?.toString ? filter._id.toString() : String(filter?._id);
    const idx = mockAddresses.findIndex((a) => a._id.toString() === idStr);
    if (idx > -1) {
      mockAddresses.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  });

  MockAddressModel.updateMany = vi.fn(async (filter: any, update: any) => {
    let count = 0;
    mockAddresses.forEach((a) => {
      let match = true;
      if (filter?.userId && (!a.userId || a.userId.toString() !== filter.userId.toString())) match = false;
      if (filter?.guestId && a.guestId !== filter.guestId) match = false;
      if (match && update?.$set) {
        Object.assign(a, update.$set);
        count++;
      }
    });
    return { modifiedCount: count };
  });

  MockAddressModel.countDocuments = vi.fn(async (filter: any) => {
    return mockAddresses.filter((a) => {
      if (filter?.userId && (!a.userId || a.userId.toString() !== filter.userId.toString())) return false;
      if (filter?.guestId && a.guestId !== filter.guestId) return false;
      return true;
    }).length;
  });

  return {
    Address: MockAddressModel,
  };
});

// Mock Order
vi.mock("../modules/checkout/models/order.model", () => {
  const MockOrderModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      status: data.status || "pending",
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
        if (filter?.userId && (!o.userId || o.userId.toString() !== filter.userId.toString())) return false;
        if (filter?.guestId && o.guestId !== filter.guestId) return false;
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

  return {
    Order: MockOrderModel,
  };
});

describe("Phase I — Checkout & Address System Integration Tests", () => {
  let app: any;
  const guestHeader = { "x-guest-id": "atelier-patron-guest-888" };

  let testProduct: any;
  let testInventory: any;

  beforeEach(() => {
    app = createApp();
    mockProducts = [];
    mockCarts = [];
    mockInventory = [];
    mockAddresses = [];
    mockOrders = [];
    mockStockMovements = [];

    // Seed Luxury Kurti
    testProduct = {
      _id: new mongoose.Types.ObjectId(),
      title: "Royal Banarasi Brocade Kurti",
      slug: "royal-banarasi-brocade-kurti",
      sku: "VYR-BAN-001",
      price: 200,
      stock: 10,
      trackQuantity: true,
      status: "active",
      variants: [],
      images: [{ url: "https://example.com/kurti.jpg" }],
    };
    mockProducts.push(testProduct);

    // Seed Inventory for testProduct
    testInventory = {
      _id: new mongoose.Types.ObjectId(),
      productId: testProduct._id,
      variantId: null,
      sku: "VYR-BAN-001",
      onHand: 10,
      reserved: 0,
      save: async function () {
        return this;
      },
    };
    mockInventory.push(testInventory);

    // Seed guest cart with 1 kurti ($200)
    mockCarts.push({
      _id: new mongoose.Types.ObjectId(),
      guestId: "atelier-patron-guest-888",
      items: [
        {
          _id: new mongoose.Types.ObjectId(),
          productId: testProduct._id,
          variantId: null,
          sku: "VYR-BAN-001",
          quantity: 1,
        },
      ],
      discountPercent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        return this;
      },
    });
  });

  describe("1. Address Management API", () => {
    it("should allow guest to create a delivery address", async () => {
      const res = await request(app)
        .post("/api/v1/addresses")
        .set(guestHeader)
        .send({
          firstName: "Ananya",
          lastName: "Roy",
          street: "74 Park Street, Flat 4B",
          city: "Kolkata",
          state: "West Bengal",
          postalCode: "700016",
          country: "India",
          phone: "+91 98300 12345",
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe("Ananya");
      expect(res.body.data.city).toBe("Kolkata");
      expect(res.body.data.isDefault).toBe(true);
      expect(mockAddresses.length).toBe(1);
    });

    it("should reject address creation if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/addresses")
        .set(guestHeader)
        .send({
          firstName: "Ananya",
          // missing street, city, state, postalCode
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it("should list addresses for guest session", async () => {
      mockAddresses.push({
        _id: new mongoose.Types.ObjectId(),
        guestId: "atelier-patron-guest-888",
        firstName: "Ananya",
        lastName: "Roy",
        street: "74 Park Street",
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700016",
        country: "India",
        isDefault: true,
      });

      const res = await request(app)
        .get("/api/v1/addresses")
        .set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it("should update an existing address", async () => {
      const addrId = new mongoose.Types.ObjectId();
      const addrDoc = {
        _id: addrId,
        guestId: "atelier-patron-guest-888",
        firstName: "Ananya",
        lastName: "Roy",
        street: "Old Street",
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700016",
        country: "India",
        isDefault: true,
        save: async function () {
          return this;
        },
      };
      mockAddresses.push(addrDoc);

      const res = await request(app)
        .put(`/api/v1/addresses/${addrId.toString()}`)
        .set(guestHeader)
        .send({
          street: "New Alipore 5th Block",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.street).toBe("New Alipore 5th Block");
    });

    it("should delete an address", async () => {
      const addrId = new mongoose.Types.ObjectId();
      const addrDoc = {
        _id: addrId,
        guestId: "atelier-patron-guest-888",
        firstName: "Ananya",
        lastName: "Roy",
        street: "Park Street",
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700016",
        country: "India",
        isDefault: true,
        save: async function () {
          return this;
        },
      };
      mockAddresses.push(addrDoc);

      const res = await request(app)
        .delete(`/api/v1/addresses/${addrId.toString()}`)
        .set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockAddresses.length).toBe(0);
    });
  });

  describe("2. Checkout Validation API", () => {
    it("should return valid checkout details with complimentary shipping when subtotal >= $150", async () => {
      const res = await request(app)
        .get("/api/v1/checkout/validate?shippingMethod=standard")
        .set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.totals.subtotal).toBe(200);
      expect(res.body.data.totals.shipping).toBe(0); // Complimentary since $200 >= $150
      expect(res.body.data.shippingOptions.length).toBe(2);
    });

    it("should charge $15 standard shipping if subtotal < $150", async () => {
      testProduct.price = 80;

      const res = await request(app)
        .get("/api/v1/checkout/validate?shippingMethod=standard")
        .set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totals.shipping).toBe(15);
      expect(res.body.data.totals.total).toBe(80 + 15 + 6.4); // subtotal + 15 + tax(8%)
    });

    it("should report invalid cart if item is out of stock", async () => {
      testInventory.onHand = 0; // zero inventory
      testProduct.stock = 0;

      const res = await request(app)
        .get("/api/v1/checkout/validate")
        .set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.isValid).toBe(false);
      expect(res.body.data.warnings.length).toBeGreaterThan(0);
      expect(res.body.data.warnings[0]).toContain("out of stock");
    });
  });

  describe("3. Order Creation & Placement API", () => {
    const validOrderPayload = {
      customerEmail: "patron@haute-couture.com",
      customerName: "Ananya Roy",
      shippingAddress: {
        firstName: "Ananya",
        lastName: "Roy",
        street: "74 Park Street, Suite 4B",
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700016",
        country: "India",
        phone: "+91 98300 12345",
      },
      shippingMethod: "standard" as const,
      customerNote: "Please handle embroidery with extra care",
      idempotencyKey: "test-idempotency-key-001",
    };

    it("should create an order successfully with verified calculations", async () => {
      const res = await request(app)
        .post("/api/v1/checkout/orders")
        .set(guestHeader)
        .send(validOrderPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toMatch(/^VY-ORD-\d{6}$/);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.subtotal).toBe(200);
      expect(res.body.data.tax).toBe(16); // 8% of 200
      expect(res.body.data.shippingCost).toBe(0); // Complimentary over $150
      expect(res.body.data.total).toBe(216);

      // Verify inventory was reserved
      expect(testInventory.reserved).toBe(1);
      expect(mockStockMovements.length).toBe(1);
      expect(mockStockMovements[0].type).toBe("reservation");

      // Verify cart was cleared
      const cart = mockCarts[0];
      expect(cart.items.length).toBe(0);
    });

    it("should provide idempotency: repeating identical request returns existing order without duplicate reservation", async () => {
      // First submission
      const res1 = await request(app)
        .post("/api/v1/checkout/orders")
        .set(guestHeader)
        .send(validOrderPayload);

      expect(res1.status).toBe(201);
      const initialReserved = testInventory.reserved;

      // Second identical submission (network retry / double-click)
      const res2 = await request(app)
        .post("/api/v1/checkout/orders")
        .set(guestHeader)
        .send(validOrderPayload);

      expect([200, 201]).toContain(res2.status);
      expect(res2.body.data.orderNumber).toBe(res1.body.data.orderNumber);
      // Inventory reservation count must NOT increment
      expect(testInventory.reserved).toBe(initialReserved);
      expect(mockStockMovements.length).toBe(1);
    });

    it("should reject order if shopping bag is empty", async () => {
      mockCarts[0].items = [];

      const res = await request(app)
        .post("/api/v1/checkout/orders")
        .set(guestHeader)
        .send({
          ...validOrderPayload,
          idempotencyKey: "test-empty-bag-key",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("empty");
    });

    it("should reject order if garment is out of stock", async () => {
      testInventory.onHand = 0;
      testProduct.stock = 0;

      const res = await request(app)
        .post("/api/v1/checkout/orders")
        .set(guestHeader)
        .send({
          ...validOrderPayload,
          idempotencyKey: "test-out-of-stock-key",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("out of stock");
    });

    it("should reject order if required shipping address is incomplete", async () => {
      const res = await request(app)
        .post("/api/v1/checkout/orders")
        .set(guestHeader)
        .send({
          customerEmail: "patron@haute-couture.com",
          customerName: "Ananya Roy",
          shippingAddress: {
            // missing required street, city, state, postalCode
            firstName: "Ananya",
          },
          shippingMethod: "standard",
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe("4. Order Retrieval API", () => {
    it("should retrieve order by ID", async () => {
      const orderId = new mongoose.Types.ObjectId();
      mockOrders.push({
        _id: orderId,
        orderNumber: "VY-ORD-999999",
        guestId: "atelier-patron-guest-888",
        customerEmail: "patron@haute-couture.com",
        customerName: "Ananya Roy",
        items: [],
        shippingAddress: {},
        billingAddress: {},
        shippingMethod: "standard",
        shippingCost: 0,
        subtotal: 200,
        discount: 0,
        tax: 16,
        total: 216,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/v1/orders/${orderId.toString()}`)
        .set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBe("VY-ORD-999999");
    });

    it("should return 404 for nonexistent order ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/orders/${fakeId.toString()}`)
        .set(guestHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
