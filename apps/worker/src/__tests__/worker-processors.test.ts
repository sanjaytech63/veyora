import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { triggerStorefrontRevalidation } from "../infrastructure/cache/cache-revalidator";
import { processOrderJob } from "../processors/order.processor";
import { processPaymentJob } from "../processors/payment.processor";
import { processEmailJob } from "../processors/email.processor";
import { workerSocketEmitter } from "../infrastructure/socket/redis-emitter";
import { logger } from "@veyora/utils";
import type { Job } from "bullmq";
import type { OrderJobPayload, PaymentJobPayload, EmailJobPayload } from "@veyora/types";

// Mock external dependencies
vi.mock("../infrastructure/socket/redis-emitter", () => ({
  workerSocketEmitter: {
    emitOrderUpdate: vi.fn(),
    emitPaymentUpdate: vi.fn(),
    emitNotification: vi.fn(),
    emitUnreadCount: vi.fn(),
  },
}));

vi.mock("@veyora/utils", async () => {
  const actual = await vi.importActual<typeof import("@veyora/utils")>("@veyora/utils");
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  };
});

describe("Worker Background Job Processors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Storefront Cache Revalidation (triggerStorefrontRevalidation)", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("sends authenticated HTTP POST with correct headers and payload", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          revalidated: ["tag:catalog", "tag:category:men"],
        }),
      });
      global.fetch = mockFetch;

      const result = await triggerStorefrontRevalidation({
        event: "catalog-sync",
        tags: ["tag:catalog", "tag:category:men"],
        storefrontUrl: "http://localhost:3000",
        secret: "test_secret_123",
        maxRetries: 1,
      });

      expect(result.success).toBe(true);
      expect(result.revalidated).toEqual(["tag:catalog", "tag:category:men"]);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const firstCall = mockFetch.mock.calls[0];
      expect(firstCall).toBeDefined();
      const [calledUrl, calledOptions] = firstCall as [string, RequestInit];
      expect(calledUrl).toBe("http://localhost:3000/api/internal/cache/revalidate");
      expect(calledOptions.method).toBe("POST");
      expect(calledOptions.headers).toMatchObject({
        "Content-Type": "application/json",
        "x-internal-cache-secret": "test_secret_123",
      });

      expect(calledOptions.body).toBeDefined();
      const body = JSON.parse(calledOptions.body as string);
      expect(body.event).toBe("catalog-sync");
      expect(body.tags).toEqual(["tag:catalog", "tag:category:men"]);
      expect(body.source).toBe("bullmq-worker");
    });

    it("retries upon HTTP 500 error and succeeds on subsequent attempt", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error",
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            revalidated: ["tag:products"],
          }),
        });
      global.fetch = mockFetch;

      const result = await triggerStorefrontRevalidation({
        event: "product-stock-update",
        tags: ["tag:products"],
        storefrontUrl: "http://localhost:3000",
        secret: "test_secret_123",
        maxRetries: 2,
      });

      expect(result.success).toBe(true);
      expect(result.revalidated).toEqual(["tag:products"]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(
        "CACHE_INVALIDATION",
        expect.stringContaining("Revalidation attempt 1/2 failed")
      );
    });

    it("exhausts all retries and safely returns failure when endpoint is unreachable", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
      global.fetch = mockFetch;

      const result = await triggerStorefrontRevalidation({
        event: "order-completed",
        tags: ["tag:orders"],
        storefrontUrl: "http://localhost:3000",
        secret: "test_secret_123",
        maxRetries: 2,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("ECONNREFUSED");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Order Background Job Processor (processOrderJob)", () => {
    it("processes order status update and emits real-time event via Redis", async () => {
      const mockJob = {
        id: "job-order-101",
        data: {
          orderId: "ord_123456",
          orderNumber: "VEY-2026-9901",
          type: "order:status_updated",
          status: "confirmed",
          customerId: "user_cust_001",
          customerEmail: "patron@luxury.com",
          idempotencyKey: "idem_order_001",
        } as OrderJobPayload,
      } as Job<OrderJobPayload>;

      const result = await processOrderJob(mockJob);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(workerSocketEmitter.emitOrderUpdate).toHaveBeenCalledWith({
        orderId: "ord_123456",
        orderNumber: "VEY-2026-9901",
        status: "confirmed",
        userId: "user_cust_001",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "ORDER_WORKER",
        expect.stringContaining("Order #VEY-2026-9901 (order:status_updated)")
      );
    });
  });

  describe("Payment Background Job Processor (processPaymentJob)", () => {
    it("processes payment verification and broadcasts real-time payment update", async () => {
      const mockJob = {
        id: "job-pay-202",
        data: {
          paymentId: "pay_rzp_987654",
          orderId: "ord_123456",
          type: "payment:verified",
          status: "captured",
          amount: 4999,
          currency: "INR",
          customerId: "user_cust_001",
          idempotencyKey: "idem_pay_001",
        } as PaymentJobPayload,
      } as Job<PaymentJobPayload>;

      const result = await processPaymentJob(mockJob);

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      expect(workerSocketEmitter.emitPaymentUpdate).toHaveBeenCalledWith({
        paymentId: "pay_rzp_987654",
        orderId: "ord_123456",
        status: "captured",
        amount: 4999,
        userId: "user_cust_001",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "PAYMENT_WORKER",
        expect.stringContaining("captured ₹4999")
      );
    });
  });

  describe("Email Dispatch Processor (processEmailJob)", () => {
    it("dispatches order confirmation email without exposing sensitive data", async () => {
      const mockJob = {
        id: "job-email-301",
        attemptsMade: 0,
        data: {
          type: "order-confirmation",
          recipient: "patron@luxury.com",
          idempotencyKey: "idem_order_conf_001",
          data: {
            orderNumber: "VEY-2026-9901",
            total: 12500,
          },
        } as EmailJobPayload,
      } as Job<EmailJobPayload>;

      const result = await processEmailJob(mockJob);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^msg_\d+_\d+$/);
      expect(logger.info).toHaveBeenCalledWith(
        "EMAIL_DISPATCH",
        expect.stringContaining(
          "Order Confirmation sent to patron@luxury.com for Order #VEY-2026-9901"
        )
      );
    });

    it("safely dispatches password reset without logging reset tokens", async () => {
      const mockJob = {
        id: "job-email-302",
        attemptsMade: 0,
        data: {
          type: "password-reset",
          recipient: "security@patron.com",
          idempotencyKey: "idem_pwd_002",
          data: {
            token: "SUPER_SECRET_TOKEN_DO_NOT_LOG_9999",
            resetUrl: "https://veyora.luxury/reset?token=SUPER_SECRET_TOKEN_DO_NOT_LOG_9999",
          },
        } as EmailJobPayload,
      } as Job<EmailJobPayload>;

      const result = await processEmailJob(mockJob);

      expect(result.success).toBe(true);

      // Verify the secret token is NEVER logged
      const allLogCalls = vi.mocked(logger.info).mock.calls.map((c) => JSON.stringify(c));
      const leakedSecret = allLogCalls.some((callStr) =>
        callStr.includes("SUPER_SECRET_TOKEN_DO_NOT_LOG_9999")
      );
      expect(leakedSecret).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        "EMAIL_DISPATCH",
        "Password Reset link securely dispatched to security@patron.com"
      );
    });

    it("safely dispatches one-time verification code without logging OTP value", async () => {
      const mockJob = {
        id: "job-email-303",
        attemptsMade: 0,
        data: {
          type: "otp",
          recipient: "patron@luxury.com",
          idempotencyKey: "idem_otp_003",
          data: {
            otp: "847291",
          },
        } as EmailJobPayload,
      } as Job<EmailJobPayload>;

      const result = await processEmailJob(mockJob);

      expect(result.success).toBe(true);

      // Verify the OTP digits are NEVER logged
      const allLogCalls = vi.mocked(logger.info).mock.calls.map((c) => JSON.stringify(c));
      const leakedOtp = allLogCalls.some((callStr) => callStr.includes("847291"));
      expect(leakedOtp).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        "EMAIL_DISPATCH",
        "One-Time Verification Code securely dispatched to patron@luxury.com"
      );
    });
  });
});
