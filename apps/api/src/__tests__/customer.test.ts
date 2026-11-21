/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";

let mockUsers: any[] = [];
let mockOrders: any[] = [];
let mockAddresses: any[] = [];
let mockActivities: any[] = [];

const mockAdminSessionId = new mongoose.Types.ObjectId();
const mockCustomerSessionId = new mongoose.Types.ObjectId();

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

// 1. Mock Session Model
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

// 2. Mock User Model
vi.mock("../modules/auth/models/user.model", () => ({
  User: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let results = [...mockUsers];
        if (filter.role) {
          results = results.filter((u) => u.role === filter.role);
        }
        if (filter.isActive !== undefined) {
          results = results.filter((u) => u.isActive === filter.isActive);
        }
        if (filter.isEmailVerified !== undefined) {
          results = results.filter((u) => u.isEmailVerified === filter.isEmailVerified);
        }
        if (filter.$or) {
          results = results.filter((u) =>
            filter.$or.some((clause: any) => {
              if (clause.firstName && clause.firstName.test(u.firstName)) return true;
              if (clause.lastName && clause.lastName.test(u.lastName)) return true;
              if (clause.email && clause.email.test(u.email)) return true;
              if (clause.phone && u.phone && clause.phone.test(u.phone)) return true;
              return false;
            })
          );
        }
        return results;
      })
    ),
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      const user = mockUsers.find((u) => u._id.toString() === idStr);
      return Promise.resolve(user || null);
    }),
    countDocuments: vi.fn((filter: any) => {
      let results = [...mockUsers];
      if (filter.role) {
        results = results.filter((u) => u.role === filter.role);
      }
      if (filter.isActive !== undefined) {
        results = results.filter((u) => u.isActive === filter.isActive);
      }
      if (filter.$or) {
        results = results.filter((u) =>
          filter.$or.some((clause: any) => {
            if (clause.firstName && clause.firstName.test(u.firstName)) return true;
            if (clause.lastName && clause.lastName.test(u.lastName)) return true;
            if (clause.email && clause.email.test(u.email)) return true;
            return false;
          })
        );
      }
      return Promise.resolve(results.length);
    }),
  },
}));

// 3. Mock Order Model
vi.mock("../modules/checkout/models/order.model", () => ({
  Order: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let results = [...mockOrders];
        if (filter.userId) {
          if (filter.userId.$in) {
            const idStrs = filter.userId.$in.map((id: any) => id.toString());
            results = results.filter((o) => o.userId && idStrs.includes(o.userId.toString()));
          } else {
            results = results.filter((o) => o.userId && o.userId.toString() === filter.userId.toString());
          }
        }
        return results;
      })
    ),
    countDocuments: vi.fn((filter: any) => {
      let results = [...mockOrders];
      if (filter.userId) {
        results = results.filter((o) => o.userId && o.userId.toString() === filter.userId.toString());
      }
      return Promise.resolve(results.length);
    }),
  },
}));

// 4. Mock Address Model
vi.mock("../modules/checkout/models/address.model", () => ({
  Address: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let results = [...mockAddresses];
        if (filter.userId) {
          results = results.filter((a) => a.userId && a.userId.toString() === filter.userId.toString());
        }
        return results;
      })
    ),
  },
}));

// 5. Mock CustomerActivity Model
vi.mock("../modules/customer/models/customer-activity.model", () => {
  const MockActivityModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      createdAt: new Date(),
    };
    return doc;
  };
  MockActivityModel.create = vi.fn((data: any) => {
    const doc: any = {
      ...data,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
    };
    mockActivities.push(doc);
    return Promise.resolve(doc);
  });
  MockActivityModel.find = vi.fn((filter: any) =>
    mockQuery(() => {
      let results = [...mockActivities];
      if (filter.customerId) {
        results = results.filter((a) => a.customerId.toString() === filter.customerId.toString());
      }
      return results;
    })
  );
  return { CustomerActivity: MockActivityModel };
});

const app = createApp();

describe("Phase M — Veyora Customer Management Tests", () => {
  let adminToken: string;
  let customerToken: string;
  let customerId1: mongoose.Types.ObjectId;
  let customerId2: mongoose.Types.ObjectId;

  beforeEach(() => {
    mockUsers = [];
    mockOrders = [];
    mockAddresses = [];
    mockActivities = [];

    customerId1 = new mongoose.Types.ObjectId();
    customerId2 = new mongoose.Types.ObjectId();

    // Seed customer 1
    const customer1: any = {
      _id: customerId1,
      firstName: "Aishwarya",
      lastName: "Sharma",
      email: "aishwarya.sharma@veyora.com",
      phone: "+91 98290 11463",
      role: "customer",
      isEmailVerified: true,
      isActive: true,
      notes: "VIP Haute Couture client.",
      statusReason: null,
      passwordHash: "secret_hash_not_to_leak",
      createdAt: new Date("2026-01-10T10:00:00Z"),
      updatedAt: new Date("2026-01-10T10:00:00Z"),
      save: vi.fn(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    // Seed customer 2 (inactive)
    const customer2: any = {
      _id: customerId2,
      firstName: "Rohan",
      lastName: "Varma",
      email: "rohan.varma@outlook.com",
      phone: "+91 98801 32190",
      role: "customer",
      isEmailVerified: false,
      isActive: false,
      notes: null,
      statusReason: "Suspicious login attempt reported",
      passwordHash: "secret_hash_not_to_leak_2",
      createdAt: new Date("2026-02-15T12:00:00Z"),
      updatedAt: new Date("2026-02-15T12:00:00Z"),
      save: vi.fn(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    mockUsers.push(customer1, customer2);

    // Seed Address for Customer 1
    mockAddresses.push({
      _id: new mongoose.Types.ObjectId(),
      userId: customerId1,
      firstName: "Aishwarya",
      lastName: "Sharma",
      street: "12 Heritage Enclave, Civil Lines",
      city: "Jaipur",
      state: "Rajasthan",
      postalCode: "302006",
      country: "India",
      phone: "+91 98290 11463",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed Orders for Customer 1
    mockOrders.push(
      {
        _id: new mongoose.Types.ObjectId(),
        userId: customerId1,
        orderNumber: "VY-ORD-100001",
        customerEmail: "aishwarya.sharma@veyora.com",
        customerName: "Aishwarya Sharma",
        items: [
          {
            id: "item-1",
            productId: new mongoose.Types.ObjectId(),
            title: "Royal Silk Sherwani",
            sku: "VY-SLK-01",
            price: 550,
            quantity: 1,
            subtotal: 550,
          },
        ],
        shippingAddress: {
          firstName: "Aishwarya",
          lastName: "Sharma",
          street: "12 Heritage Enclave",
          city: "Jaipur",
          state: "Rajasthan",
          postalCode: "302006",
          country: "India",
        },
        billingAddress: {
          firstName: "Aishwarya",
          lastName: "Sharma",
          street: "12 Heritage Enclave",
          city: "Jaipur",
          state: "Rajasthan",
          postalCode: "302006",
          country: "India",
        },
        shippingMethod: "standard",
        shippingCost: 0,
        subtotal: 550,
        discount: 50,
        tax: 40,
        total: 540,
        status: "delivered",
        createdAt: new Date("2026-02-01T10:00:00Z"),
        updatedAt: new Date("2026-02-01T10:00:00Z"),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        userId: customerId1,
        orderNumber: "VY-ORD-100002",
        customerEmail: "aishwarya.sharma@veyora.com",
        customerName: "Aishwarya Sharma",
        items: [],
        shippingAddress: {
          firstName: "Aishwarya",
          lastName: "Sharma",
          street: "12 Heritage Enclave",
          city: "Jaipur",
          state: "Rajasthan",
          postalCode: "302006",
          country: "India",
        },
        billingAddress: {
          firstName: "Aishwarya",
          lastName: "Sharma",
          street: "12 Heritage Enclave",
          city: "Jaipur",
          state: "Rajasthan",
          postalCode: "302006",
          country: "India",
        },
        shippingMethod: "standard",
        shippingCost: 0,
        subtotal: 300,
        discount: 0,
        tax: 24,
        total: 324,
        status: "processing",
        createdAt: new Date("2026-02-10T10:00:00Z"),
        updatedAt: new Date("2026-02-10T10:00:00Z"),
      }
    );

    // Generate JWT access tokens
    const secret = "veyora_jwt_access_secret_super_secure_32chars_min";

    adminToken = jwt.sign(
      {
        sub: new mongoose.Types.ObjectId().toString(),
        email: "admin@veyora.com",
        role: "admin",
        permissions: ["read:users", "write:users"],
        sessionId: mockAdminSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    customerToken = jwt.sign(
      {
        sub: customerId1.toString(),
        email: "aishwarya.sharma@veyora.com",
        role: "customer",
        permissions: [],
        sessionId: mockCustomerSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );
  });

  // ==========================================
  // 1. LIST & SEARCH CUSTOMERS
  // ==========================================
  describe("GET /api/v1/admin/customers", () => {
    it("returns paginated list of customers with aggregated order statistics", async () => {
      const res = await request(app)
        .get("/api/v1/admin/customers")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.total).toBe(2);

      const aishwarya = res.body.data.items.find((c: any) => c.email === "aishwarya.sharma@veyora.com");
      expect(aishwarya).toBeDefined();
      expect(aishwarya.ordersCount).toBe(2);
      expect(aishwarya.totalSpent).toBe(864); // 540 + 324
      expect(aishwarya.averageOrderValue).toBe(432); // 864 / 2
      expect(aishwarya.passwordHash).toBeUndefined(); // Security: Never leak password hash
    });

    it("filters customers by search keyword matching first name, last name, or email", async () => {
      const res = await request(app)
        .get("/api/v1/admin/customers?search=aishwarya")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].firstName).toBe("Aishwarya");
    });

    it("filters customers by status: active only", async () => {
      const res = await request(app)
        .get("/api/v1/admin/customers?status=active")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].isActive).toBe(true);
      expect(res.body.data.items[0].firstName).toBe("Aishwarya");
    });

    it("filters customers by status: inactive only", async () => {
      const res = await request(app)
        .get("/api/v1/admin/customers?status=inactive")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].isActive).toBe(false);
      expect(res.body.data.items[0].firstName).toBe("Rohan");
    });
  });

  // ==========================================
  // 2. CUSTOMER DETAILS & RELATED DATA
  // ==========================================
  describe("GET /api/v1/admin/customers/:id", () => {
    it("returns comprehensive customer profile, addresses, recent orders, and lifetime stats", async () => {
      const res = await request(app)
        .get(`/api/v1/admin/customers/${customerId1}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.id).toBe(customerId1.toString());
      expect(data.email).toBe("aishwarya.sharma@veyora.com");
      expect(data.ordersCount).toBe(2);
      expect(data.totalSpent).toBe(864);
      expect(data.addresses).toHaveLength(1);
      expect(data.addresses[0].city).toBe("Jaipur");
      expect(data.recentOrders).toHaveLength(2);
      expect(data.passwordHash).toBeUndefined();
    });

    it("returns 404 Not Found when customer does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/admin/customers/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns 404 when customer ID is not a valid ObjectId", async () => {
      const res = await request(app)
        .get("/api/v1/admin/customers/invalid-id-xyz")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 3. CUSTOMER ORDERS & ADDRESSES ENDPOINTS
  // ==========================================
  describe("Sub-resource retrieval endpoints", () => {
    it("retrieves customer order history via GET /api/v1/admin/customers/:id/orders", async () => {
      const res = await request(app)
        .get(`/api/v1/admin/customers/${customerId1}/orders`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.items[0].orderNumber).toBe("VY-ORD-100001");
    });

    it("retrieves customer saved addresses via GET /api/v1/admin/customers/:id/addresses", async () => {
      const res = await request(app)
        .get(`/api/v1/admin/customers/${customerId1}/addresses`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].street).toBe("12 Heritage Enclave, Civil Lines");
    });
  });

  // ==========================================
  // 4. CUSTOMER STATUS MANAGEMENT & AUDIT LOGS
  // ==========================================
  describe("PATCH /api/v1/admin/customers/:id/status & Audit Trail", () => {
    it("successfully suspends an active customer with reason and logs audit activity", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/customers/${customerId1}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          isActive: false,
          reason: "Payment dispute under review.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
      expect(res.body.data.statusReason).toBe("Payment dispute under review.");

      // Verify audit activity was created
      expect(mockActivities).toHaveLength(1);
      expect(mockActivities[0].action).toBe("CUSTOMER_DEACTIVATED");
      expect(mockActivities[0].reason).toBe("Payment dispute under review.");
      expect(mockActivities[0].performedBy).toBe("admin@veyora.com");
    });

    it("successfully re-activates a customer account", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/customers/${customerId2}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          isActive: true,
          reason: "Identity verified via concierge.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(true);
      expect(mockActivities[0].action).toBe("CUSTOMER_ACTIVATED");
    });

    it("rejects status update when isActive field is missing with 422", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/customers/${customerId1}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Missing isActive field",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("retrieves account activity log via GET /api/v1/admin/customers/:id/activity", async () => {
      // Create a status change first
      await request(app)
        .patch(`/api/v1/admin/customers/${customerId1}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false, reason: "Account audit required." });

      const res = await request(app)
        .get(`/api/v1/admin/customers/${customerId1}/activity`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].action).toBe("CUSTOMER_DEACTIVATED");
      expect(res.body.data[0].performedBy).toBe("admin@veyora.com");
    });

    it("updates internal customer notes via PATCH /api/v1/admin/customers/:id/notes", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/customers/${customerId1}/notes`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ notes: "Prefers communication via WhatsApp concierge." });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe("Prefers communication via WhatsApp concierge.");
      expect(mockActivities[0].action).toBe("NOTE_UPDATED");
    });
  });

  // ==========================================
  // 5. SECURITY & AUTHORIZATION TESTS
  // ==========================================
  describe("Security, PII Protection & Access Control", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/v1/admin/customers");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects customer attempts to access admin customer management with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/v1/admin/customers")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("rejects customer attempts to modify customer status with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/customers/${customerId1}/status`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });
});
