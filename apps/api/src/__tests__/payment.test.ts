/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { createApp } from "../app";
import { env } from "../config/env";

let mockOrders: any[] = [];
let mockPayments: any[] = [];
let mockWebhookEvents: any[] = [];

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

// 1. Mock Session model for Auth middleware
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

// 2. Mock Order Model
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

  MockOrderModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return (
        mockOrders.find((o) => {
          if (filter?._id && o._id.toString() === filter._id.toString()) return true;
          if (filter?.orderNumber && o.orderNumber === filter.orderNumber) return true;
          if (filter?.$or && Array.isArray(filter.$or)) {
            return filter.$or.some((clause: any) => {
              if (clause._id && o._id.toString() === clause._id.toString()) return true;
              if (clause.orderNumber && o.orderNumber === clause.orderNumber) return true;
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

// 3. Mock Payment Model
vi.mock("../modules/payment/models/payment.model", () => {
  const MockPaymentModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      status: data.status || "pending",
      attemptCount: data.attemptCount || 1,
      refunds: data.refunds || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = mockPayments.findIndex((p) => p._id.toString() === doc._id.toString());
        doc.updatedAt = new Date();
        if (idx > -1) {
          mockPayments[idx] = doc;
        } else {
          mockPayments.push(doc);
        }
        return doc;
      },
    };
    return doc;
  };

  MockPaymentModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return (
        mockPayments.find((p) => {
          if (filter?.orderId && p.orderId.toString() !== filter.orderId.toString()) return false;
          if (filter?.gatewayOrderId && p.gatewayOrderId !== filter.gatewayOrderId) return false;
          if (filter?.gatewayPaymentId && p.gatewayPaymentId !== filter.gatewayPaymentId) return false;
          if (filter?.status) {
            if (typeof filter.status === "string" && p.status !== filter.status) return false;
            if (filter.status.$in && !filter.status.$in.includes(p.status)) return false;
          }
          return true;
        }) || null
      );
    })
  );

  MockPaymentModel.findById = vi.fn((id: any) =>
    mockQuery(() => {
      const idStr = id?.toString ? id.toString() : String(id);
      return mockPayments.find((p) => p._id.toString() === idStr) || null;
    })
  );

  MockPaymentModel.find = vi.fn((filter: any) =>
    mockQuery(() => {
      return mockPayments.filter((p) => {
        if (filter?.orderId && p.orderId.toString() !== filter.orderId.toString()) return false;
        return true;
      });
    })
  );

  return {
    Payment: MockPaymentModel,
  };
});

// 4. Mock WebhookEvent Model
vi.mock("../modules/payment/models/webhook-event.model", () => {
  const MockWebhookEventModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      status: data.status || "processed",
      processedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = mockWebhookEvents.findIndex((e) => e.eventId === doc.eventId);
        doc.updatedAt = new Date();
        if (idx > -1) {
          mockWebhookEvents[idx] = doc;
        } else {
          mockWebhookEvents.push(doc);
        }
        return doc;
      },
    };
    return doc;
  };

  MockWebhookEventModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return mockWebhookEvents.find((e) => e.eventId === filter.eventId) || null;
    })
  );

  return {
    WebhookEvent: MockWebhookEventModel,
  };
});

describe("Phase K — Veyora Payment Integration Tests", () => {
  let app: any;
  const jwtSecret = env.JWT_ACCESS_SECRET || "veyora_jwt_access_secret_super_secure_32chars_min";
  const rzpKeySecret = env.RAZORPAY_KEY_SECRET || "rzp_test_VeyoraSecretKey456";
  const rzpWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET || "rzp_webhook_secret_789";

  const adminToken = jwt.sign(
    {
      sub: new mongoose.Types.ObjectId().toString(),
      email: "finance@veyora.internal",
      role: "admin",
      permissions: ["manage:payments"],
      sessionId: mockAdminSessionId.toString(),
    },
    jwtSecret
  );

  const customerId = new mongoose.Types.ObjectId().toString();
  const customerToken = jwt.sign(
    {
      sub: customerId,
      email: "ananya.patel@example.com",
      role: "customer",
      permissions: [],
      sessionId: mockCustomerSessionId.toString(),
    },
    jwtSecret
  );

  const otherCustomerId = new mongoose.Types.ObjectId().toString();
  const otherCustomerToken = jwt.sign(
    {
      sub: otherCustomerId,
      email: "other@example.com",
      role: "customer",
      permissions: [],
      sessionId: mockOtherSessionId.toString(),
    },
    jwtSecret
  );

  let testOrder: any;

  beforeEach(() => {
    app = createApp();
    mockOrders = [];
    mockPayments = [];
    mockWebhookEvents = [];

    testOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "VYR-20261121-7788",
      userId: new mongoose.Types.ObjectId(customerId),
      guestId: null,
      customerEmail: "ananya.patel@example.com",
      customerName: "Ananya Patel",
      status: "pending",
      subtotal: 1500,
      discount: 0,
      shippingCost: 0,
      tax: 75,
      total: 1575,
      items: [
        {
          id: "item_1",
          productId: new mongoose.Types.ObjectId().toString(),
          sku: "VYR-SLK-RED-M",
          title: "Raw Silk Banarasi Kurti",
          price: 1500,
          quantity: 1,
        },
      ],
      shippingAddress: {
        firstName: "Ananya",
        lastName: "Patel",
        street: "74 Marina Boulevard",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
        phone: "+91 98200 12345",
      },
      shippingMethod: "standard",
      statusHistory: [],
      save: async function () {
        const idx = mockOrders.findIndex((o) => o._id.toString() === testOrder._id.toString());
        if (idx > -1) mockOrders[idx] = testOrder;
        else mockOrders.push(testOrder);
        return testOrder;
      },
    };
    mockOrders.push(testOrder);
  });

  // ==========================================
  // 1. PAYMENT INITIATION
  // ==========================================
  describe("1. Payment Initiation (POST /api/v1/payments/initiate)", () => {
    it("should successfully initiate a payment order for an authenticated customer", async () => {
      const res = await request(app)
        .post("/api/v1/payments/initiate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
          provider: "razorpay",
          currency: "INR",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe(testOrder._id.toString());
      expect(res.body.data.orderNumber).toBe(testOrder.orderNumber);
      expect(res.body.data.amount).toBe(1575);
      expect(res.body.data.amountSubunits).toBe(157500); // INR paise
      expect(res.body.data.currency).toBe("INR");
      expect(res.body.data.gatewayOrderId).toMatch(/^order_/);
      expect(res.body.data.keyId).toBeDefined();

      // Check payment record created in DB
      expect(mockPayments.length).toBe(1);
      expect(mockPayments[0].status).toBe("pending");
      expect(mockPayments[0].attemptCount).toBe(1);
      expect(mockPayments[0].gatewayOrderId).toBe(res.body.data.gatewayOrderId);
    });

    it("should reject payment initiation if requested by an unauthorized customer", async () => {
      const res = await request(app)
        .post("/api/v1/payments/initiate")
        .set("Authorization", `Bearer ${otherCustomerToken}`)
        .send({
          orderId: testOrder._id.toString(),
          provider: "razorpay",
        });

      expect(res.status).toBe(404);
      expect(mockPayments.length).toBe(0);
    });

    it("should reject payment initiation if the order is already cancelled or refunded", async () => {
      testOrder.status = "cancelled";

      const res = await request(app)
        .post("/api/v1/payments/initiate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("terminal status");
    });

    it("should prevent double-settlement if order is already paid successfully (Idempotency)", async () => {
      // Simulate existing successful payment
      mockPayments.push({
        _id: new mongoose.Types.ObjectId(),
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        status: "successful",
        amount: testOrder.total,
        currency: "INR",
      });

      const res = await request(app)
        .post("/api/v1/payments/initiate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already been settled");
    });
  });

  // ==========================================
  // 2. SERVER-SIDE SIGNATURE VERIFICATION
  // ==========================================
  describe("2. Cryptographic Payment Verification (POST /api/v1/payments/verify)", () => {
    let gatewayOrderId: string;
    let gatewayPaymentId: string;

    beforeEach(async () => {
      // Initiate payment first
      const initRes = await request(app)
        .post("/api/v1/payments/initiate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
          provider: "razorpay",
        });

      gatewayOrderId = initRes.body.data.gatewayOrderId;
      gatewayPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
    });

    it("should verify genuine payment signature, transition payment to successful, and order to confirmed", async () => {
      // Generate genuine HMAC-SHA256 signature
      const validSignature = crypto
        .createHmac("sha256", rzpKeySecret)
        .update(`${gatewayOrderId}|${gatewayPaymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/payments/verify")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
          gatewayOrderId,
          gatewayPaymentId,
          gatewaySignature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("successful");

      // Verify payment DB record
      const payment = mockPayments.find((p) => p.gatewayOrderId === gatewayOrderId);
      expect(payment.status).toBe("successful");
      expect(payment.gatewayPaymentId).toBe(gatewayPaymentId);
      expect(payment.gatewaySignature).toBe(validSignature);

      // Verify Order transition: pending -> confirmed
      expect(testOrder.status).toBe("confirmed");
      expect(testOrder.statusHistory.length).toBe(1);
      expect(testOrder.statusHistory[0].toStatus).toBe("confirmed");
      expect(testOrder.statusHistory[0].reason).toContain("Payment verified");
    });

    it("should reject tampered or invalid signature with 400 Bad Request and mark payment failed", async () => {
      const tamperedSignature = "tampered_fake_signature_hash_1234567890abcdef";

      const res = await request(app)
        .post("/api/v1/payments/verify")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
          gatewayOrderId,
          gatewayPaymentId,
          gatewaySignature: tamperedSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid gateway signature");

      // Payment record must be marked as failed with security error
      const payment = mockPayments.find((p) => p.gatewayOrderId === gatewayOrderId);
      expect(payment.status).toBe("failed");
      expect(payment.error.code).toBe("INVALID_SIGNATURE");

      // Order status MUST remain pending (never trust failed or tampered payment)
      expect(testOrder.status).toBe("pending");
      expect(testOrder.statusHistory.length).toBe(0);
    });
  });

  // ==========================================
  // 3. PAYMENT RETRY
  // ==========================================
  describe("3. Payment Retry (POST /api/v1/payments/retry)", () => {
    it("should increment attempt count and issue new gateway order on retry", async () => {
      // 1. Initial attempt
      const initRes = await request(app)
        .post("/api/v1/payments/initiate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
        });
      const firstGatewayOrderId = initRes.body.data.gatewayOrderId;

      // 2. Retry attempt
      const retryRes = await request(app)
        .post("/api/v1/payments/retry")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
        });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.success).toBe(true);
      expect(retryRes.body.data.gatewayOrderId).toBeDefined();
      expect(firstGatewayOrderId).toBeDefined();

      // Attempt count should be 2
      expect(mockPayments[0].attemptCount).toBe(2);
      expect(mockPayments[0].status).toBe("pending");
    });
  });

  // ==========================================
  // 4. WEBHOOKS & IDEMPOTENCY
  // ==========================================
  describe("4. Webhook Processing & Idempotency (POST /api/v1/payments/webhook/razorpay)", () => {
    let gatewayOrderId: string;
    let gatewayPaymentId: string;

    beforeEach(async () => {
      // Initiate payment
      const initRes = await request(app)
        .post("/api/v1/payments/initiate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id.toString(),
        });

      gatewayOrderId = initRes.body.data.gatewayOrderId;
      gatewayPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
    });

    it("should successfully process payment.captured webhook with valid HMAC signature", async () => {
      const eventId = `evt_${crypto.randomBytes(8).toString("hex")}`;
      const webhookPayload = {
        id: eventId,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: gatewayPaymentId,
              order_id: gatewayOrderId,
              amount: 157500,
              currency: "INR",
              status: "captured",
            },
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac("sha256", rzpWebhookSecret)
        .update(rawBody)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/payments/webhook/razorpay")
        .set("x-razorpay-signature", signature)
        .set("Content-Type", "application/json")
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.duplicate).toBeUndefined();

      // Payment marked successful
      const payment = mockPayments.find((p) => p.gatewayOrderId === gatewayOrderId);
      expect(payment.status).toBe("successful");
      expect(payment.gatewayPaymentId).toBe(gatewayPaymentId);

      // Order transitioned to confirmed
      expect(testOrder.status).toBe("confirmed");

      // Webhook event recorded in DB
      expect(mockWebhookEvents.length).toBe(1);
      expect(mockWebhookEvents[0].eventId).toBe(eventId);
      expect(mockWebhookEvents[0].status).toBe("processed");
    });

    it("should handle duplicate webhook delivery idempotently without repeated side-effects", async () => {
      const eventId = `evt_${crypto.randomBytes(8).toString("hex")}`;
      const webhookPayload = {
        id: eventId,
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: gatewayPaymentId,
              order_id: gatewayOrderId,
              amount: 157500,
            },
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac("sha256", rzpWebhookSecret)
        .update(rawBody)
        .digest("hex");

      // First delivery
      const res1 = await request(app)
        .post("/api/v1/payments/webhook/razorpay")
        .set("x-razorpay-signature", signature)
        .set("Content-Type", "application/json")
        .send(rawBody);

      expect(res1.status).toBe(200);
      expect(res1.body.duplicate).toBeUndefined();
      const statusHistoryLength = testOrder.statusHistory.length;

      // Duplicate delivery with identical eventId
      const res2 = await request(app)
        .post("/api/v1/payments/webhook/razorpay")
        .set("x-razorpay-signature", signature)
        .set("Content-Type", "application/json")
        .send(rawBody);

      expect(res2.status).toBe(200);
      expect(res2.body.duplicate).toBe(true);
      expect(res2.body.message).toContain("already processed");

      // Ensure no duplicate status history entries were added
      expect(testOrder.statusHistory.length).toBe(statusHistoryLength);
    });

    it("should update payment status to failed on payment.failed webhook event", async () => {
      const eventId = `evt_${crypto.randomBytes(8).toString("hex")}`;
      const webhookPayload = {
        id: eventId,
        event: "payment.failed",
        payload: {
          payment: {
            entity: {
              id: gatewayPaymentId,
              order_id: gatewayOrderId,
              error_code: "BAD_REQUEST_ERROR",
              error_description: "Card has insufficient funds",
            },
          },
        },
      };

      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac("sha256", rzpWebhookSecret)
        .update(rawBody)
        .digest("hex");

      const res = await request(app)
        .post("/api/v1/payments/webhook/razorpay")
        .set("x-razorpay-signature", signature)
        .set("Content-Type", "application/json")
        .send(rawBody);

      expect(res.status).toBe(200);

      const payment = mockPayments.find((p) => p.gatewayOrderId === gatewayOrderId);
      expect(payment.status).toBe("failed");
      expect(payment.error.code).toBe("BAD_REQUEST_ERROR");
      expect(payment.error.description).toContain("insufficient funds");
    });

    it("should reject webhook with invalid signature with 401 Unauthorized", async () => {
      const rawBody = JSON.stringify({ event: "payment.captured" });
      const badSignature = "invalid_webhook_hmac_signature";

      const res = await request(app)
        .post("/api/v1/payments/webhook/razorpay")
        .set("x-razorpay-signature", badSignature)
        .set("Content-Type", "application/json")
        .send(rawBody);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid webhook signature");
    });
  });

  // ==========================================
  // 5. REFUND PROCESSING
  // ==========================================
  describe("5. Refund Processing (POST /api/v1/admin/payments/:orderId/refund)", () => {
    let paymentRecord: any;

    beforeEach(async () => {
      // Setup order in confirmed state with a successful payment
      testOrder.status = "confirmed";
      paymentRecord = {
        _id: new mongoose.Types.ObjectId(),
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        userId: testOrder.userId,
        provider: "razorpay",
        gatewayOrderId: "order_test_settled_123",
        gatewayPaymentId: "pay_test_settled_456",
        amount: testOrder.total,
        currency: "INR",
        status: "successful",
        attemptCount: 1,
        refunds: [],
        save: async function () {
          const idx = mockPayments.findIndex((p) => p._id.toString() === paymentRecord._id.toString());
          if (idx > -1) mockPayments[idx] = paymentRecord;
          else mockPayments.push(paymentRecord);
          return paymentRecord;
        },
      };
      mockPayments.push(paymentRecord);
    });

    it("should allow admin to issue a full refund, transitioning order and payment to refunded", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/payments/${testOrder._id.toString()}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          reason: "Garment damaged during atelier fitting inspection",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(1575);
      expect(res.body.data.status).toBe("processed");

      // Verify payment model
      expect(paymentRecord.status).toBe("refunded");
      expect(paymentRecord.refunds.length).toBe(1);
      expect(paymentRecord.refunds[0].amount).toBe(1575);

      // Verify order transitioned to refunded
      expect(testOrder.status).toBe("refunded");
    });

    it("should allow partial refund, transitioning payment to partially_refunded", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/payments/${testOrder._id.toString()}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 500,
          reason: "Courtesy goodwill credit for delayed delivery",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(500);

      expect(paymentRecord.status).toBe("partially_refunded");
      expect(paymentRecord.refunds.length).toBe(1);
      expect(paymentRecord.refunds[0].amount).toBe(500);
    });

    it("should reject refund request exceeding total paid balance", async () => {
      // First refund $1575 fully
      paymentRecord.refunds.push({
        refundId: "ref_1",
        gatewayRefundId: "rfnd_1",
        amount: 1575,
        status: "processed",
      });
      paymentRecord.status = "refunded";

      const res = await request(app)
        .post(`/api/v1/admin/payments/${testOrder._id.toString()}/refund`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already been fully refunded");
    });

    it("should reject customer attempts to access admin refund endpoint with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/v1/admin/payments/${testOrder._id.toString()}/refund`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          reason: "Customer self-refund attempt",
        });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 6. PAYMENT STATUS RETRIEVAL
  // ==========================================
  describe("6. Payment Status Retrieval (GET /api/v1/payments/status/:orderId)", () => {
    it("should return detailed payment summary for order owner", async () => {
      mockPayments.push({
        _id: new mongoose.Types.ObjectId(),
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        userId: testOrder.userId,
        provider: "razorpay",
        gatewayOrderId: "order_summary_123",
        gatewayPaymentId: "pay_summary_456",
        amount: testOrder.total,
        currency: "INR",
        status: "successful",
        attemptCount: 1,
        refunds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/v1/payments/status/${testOrder._id.toString()}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe(testOrder._id.toString());
      expect(res.body.data.orderNumber).toBe(testOrder.orderNumber);
      expect(res.body.data.status).toBe("successful");
      expect(res.body.data.amount).toBe(1575);
      expect(res.body.data.refunds.length).toBe(0);
    });
  });
});
