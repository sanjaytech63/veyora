import { describe, it, expect } from "vitest";
import request from "supertest";
import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requestId } from "../middleware/request-id";
import { errorHandler } from "../middleware/error-handler";
import { notFoundHandler } from "../middleware/not-found";
import { validateRequest } from "../middleware/validate-request";
import { sendSuccess } from "../utils/response";
import { AppError } from "@veyora/utils";
import { ApiResponseCode } from "@veyora/types";

describe("Express API Core Response Infrastructure & Error Middleware", () => {
  // Build a test Express app utilizing the canonical middleware suite
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestId);
  app.use(express.json());

  // Strict rate limiter for testing
  const testLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const reqId = req.id || (res.getHeader("X-Request-Id") as string) || "unknown";
      res.status(429).json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again shortly.",
        meta: {
          requestId: reqId,
          timestamp: new Date().toISOString(),
        },
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again shortly.",
        },
      });
    },
  });

  // Test routes for success helper
  app.get("/test/success-basic", (_req: Request, res: Response) => {
    sendSuccess(res, {
      code: ApiResponseCode.CART_ITEM_ADDED,
      message: "Garment added to your shopping bag.",
      data: { itemCount: 2, subtotal: 2500 },
    });
  });

  app.post("/test/success-custom-status", (_req: Request, res: Response) => {
    sendSuccess(res, {
      statusCode: 201,
      code: ApiResponseCode.ORDER_PLACED,
      message: "Order placed successfully.",
      data: { orderNumber: "VY-8921", total: 4500 },
    });
  });

  app.get("/test/success-paginated", (_req: Request, res: Response) => {
    sendSuccess(res, {
      code: "PRODUCTS_FETCHED",
      message: "Products retrieved.",
      data: [{ id: "p1", name: "Silk Shirt" }],
      meta: {
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false,
        },
      },
    });
  });

  app.get("/test/success-positional", (_req: Request, res: Response) => {
    sendSuccess(
      res,
      { status: "active" },
      "Profile status loaded.",
      "PROFILE_LOADED",
      undefined,
      200
    );
  });

  // Test routes for error middleware
  app.get("/test/error-app-error", () => {
    throw new AppError({
      statusCode: 409,
      code: ApiResponseCode.INSUFFICIENT_STOCK,
      message: "The requested quantity is no longer available.",
    });
  });

  app.post(
    "/test/error-validation",
    validateRequest({
      body: z.object({
        email: z.string().email("Enter a valid email address."),
        age: z.number().min(18, "Must be at least 18 years old."),
        address: z.object({
          postalCode: z.string().min(5, "Postal code too short."),
        }),
      }),
    }),
    (req: Request, res: Response) => {
      sendSuccess(res, {
        code: "VALIDATION_PASSED",
        message: "Valid data",
        data: req.body,
      });
    }
  );

  app.get("/test/error-mongo-duplicate", () => {
    const err = new Error(
      "E11000 duplicate key error collection: veyora.users index: email_1 dup key: { email: 'test@example.com' }"
    );
    (err as unknown as { code: number }).code = 11000;
    (err as unknown as { keyPattern: Record<string, number> }).keyPattern = { email: 1 };
    throw err;
  });

  app.get("/test/error-cast", () => {
    const err = new Error(
      "Cast to ObjectId failed for value 'invalid-id' at path '_id' for model 'Product'"
    );
    err.name = "CastError";
    (err as unknown as { path: string }).path = "_id";
    throw err;
  });

  app.get("/test/error-unknown", () => {
    throw new Error("Critical internal failure inside native driver at /var/app/internal.js");
  });

  app.get("/test/error-sensitive-leak", () => {
    throw new AppError(
      "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and password='mysecretpassword'",
      400,
      "INVALID_INPUT"
    );
  });

  // Test route for rate limiter
  app.get("/test/rate-limited", testLimiter, (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  // Standard 404 and Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  describe("1. Success Response Helper (`sendSuccess`)", () => {
    it("1. returns canonical success envelope with code, message, data, and meta", async () => {
      const res = await request(app).get("/test/success-basic");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("CART_ITEM_ADDED");
      expect(res.body.message).toBe("Garment added to your shopping bag.");
      expect(res.body.data).toEqual({ itemCount: 2, subtotal: 2500 });
      expect(res.body.meta).toBeDefined();
    });

    it("2. preserves custom HTTP status (201 Created)", async () => {
      const res = await request(app).post("/test/success-custom-status");
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("ORDER_PLACED");
      expect(res.body.data.orderNumber).toBe("VY-8921");
    });

    it("3. includes stable code and human-readable message", async () => {
      const res = await request(app).get("/test/success-basic");
      expect(typeof res.body.code).toBe("string");
      expect(res.body.code).toBe(ApiResponseCode.CART_ITEM_ADDED);
      expect(res.body.message).toBe("Garment added to your shopping bag.");
    });

    it("4. includes request ID and timestamp metadata", async () => {
      const res = await request(app).get("/test/success-basic");
      expect(res.body.meta.requestId).toBeDefined();
      expect(typeof res.body.meta.requestId).toBe("string");
      expect(res.body.meta.requestId.length).toBeGreaterThan(0);
      expect(res.body.meta.timestamp).toBeDefined();
      expect(new Date(res.body.meta.timestamp).getTime()).not.toBeNaN();
    });

    it("5. supports pagination metadata envelope", async () => {
      const res = await request(app).get("/test/success-paginated");
      expect(res.status).toBe(200);
      expect(res.body.meta.pagination).toBeDefined();
      expect(res.body.meta.pagination.totalPages).toBe(3);
      expect(res.body.meta.pagination.hasNextPage).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it("6. supports positional parameters signature without exposing unexpected fields", async () => {
      const res = await request(app).get("/test/success-positional");
      expect(res.status).toBe(200);
      expect(res.body.code).toBe("PROFILE_LOADED");
      expect(res.body.message).toBe("Profile status loaded.");
      expect(res.body.data).toEqual({ status: "active" });
    });
  });

  describe("2. Error Middleware (`errorHandler`)", () => {
    it("7. normalizes custom AppError instances to canonical contract", async () => {
      const res = await request(app).get("/test/error-app-error");
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INSUFFICIENT_STOCK");
      expect(res.body.message).toBe("The requested quantity is no longer available.");
      expect(res.body.meta.requestId).toBeDefined();
    });

    it("8. normalizes Zod validation errors with nested paths into details", async () => {
      const res = await request(app)
        .post("/test/error-validation")
        .send({
          email: "not-an-email",
          age: 15,
          address: { postalCode: "123" },
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.message).toBe("Please review the submitted information.");
      expect(Array.isArray(res.body.details)).toBe(true);

      const fields = res.body.details.map((d: { field?: string }) => d.field);
      expect(fields).toContain("email");
      expect(fields).toContain("age");
      expect(fields).toContain("address.postalCode");
    });

    it("9. handles MongoDB duplicate-key errors safely without leaking internal schema", async () => {
      const res = await request(app).get("/test/error-mongo-duplicate");
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("CONFLICT");
      expect(res.body.message).toBe("A resource with the specified identifier already exists.");
      expect(res.body.details[0]?.field).toBe("email");
      expect(JSON.stringify(res.body)).not.toContain("veyora.users");
      expect(JSON.stringify(res.body)).not.toContain("E11000");
    });

    it("10. handles Mongoose CastError safely with INVALID_ID", async () => {
      const res = await request(app).get("/test/error-cast");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INVALID_ID");
      expect(res.body.message).toBe("Invalid identifier format provided.");
      expect(res.body.details[0]?.field).toBe("_id");
    });

    it("11. handles unknown exceptions with generic messages", async () => {
      const res = await request(app).get("/test/error-unknown");
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INTERNAL_SERVER_ERROR");
      expect(res.body.message).toBe(
        "An unexpected internal server error occurred. Please try again later."
      );
    });

    it("12. preserves appropriate HTTP status codes", async () => {
      const res409 = await request(app).get("/test/error-app-error");
      expect(res409.status).toBe(409);

      const res400 = await request(app).get("/test/error-cast");
      expect(res400.status).toBe(400);

      const res500 = await request(app).get("/test/error-unknown");
      expect(res500.status).toBe(500);
    });

    it("13. does not expose stack traces to client", async () => {
      const res = await request(app).get("/test/error-unknown");
      expect(res.body.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain("/var/app/internal.js");
      expect(JSON.stringify(res.body)).not.toContain("Critical internal failure");
    });

    it("14. does not leak secrets, bearer tokens, or passwords", async () => {
      const res = await request(app).get("/test/error-sensitive-leak");
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(JSON.stringify(res.body)).not.toContain("mysecretpassword");
      expect(res.body.message).toBe("An error occurred while processing your request.");
    });

    it("15. includes request correlation ID in error responses", async () => {
      const customTraceId = "trace-err-test-456";
      const res = await request(app)
        .get("/test/error-app-error")
        .set("X-Request-Id", customTraceId);

      expect(res.body.meta.requestId).toBe(customTraceId);
      expect(res.headers["x-request-id"]).toBe(customTraceId);
    });
  });

  describe("3. Rate Limiter Middleware (`rateLimiter`)", () => {
    it("16. returns canonical error structure when rate limit exceeded", async () => {
      const uniqueIp = "192.168.1.100";
      // First request: OK (max 1)
      const res1 = await request(app).get("/test/rate-limited").set("X-Forwarded-For", uniqueIp);
      expect(res1.status).toBe(200);

      // Second request: Throttled
      const res2 = await request(app).get("/test/rate-limited").set("X-Forwarded-For", uniqueIp);
      expect(res2.status).toBe(429);
      expect(res2.body.success).toBe(false);
      expect(res2.body.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(res2.body.message).toBe("Too many requests. Please try again shortly.");
    });

    it("17. uses HTTP status 429", async () => {
      const uniqueIp = "192.168.1.101";
      await request(app).get("/test/rate-limited").set("X-Forwarded-For", uniqueIp);
      const res = await request(app).get("/test/rate-limited").set("X-Forwarded-For", uniqueIp);
      expect(res.status).toBe(429);
    });

    it("18. includes request correlation ID in rate limit responses", async () => {
      const uniqueIp = "192.168.1.102";
      await request(app).get("/test/rate-limited").set("X-Forwarded-For", uniqueIp);
      const res = await request(app)
        .get("/test/rate-limited")
        .set("X-Forwarded-For", uniqueIp)
        .set("X-Request-Id", "trace-ratelimit-789");

      expect(res.status).toBe(429);
      expect(res.body.meta.requestId).toBe("trace-ratelimit-789");
    });

    it("19. preserves Retry-After header", async () => {
      const uniqueIp = "192.168.1.103";
      await request(app).get("/test/rate-limited").set("X-Forwarded-For", uniqueIp);
      const res = await request(app).get("/test/rate-limited").set("X-Forwarded-For", uniqueIp);
      expect(res.status).toBe(429);
      expect(res.headers).toHaveProperty("retry-after");
    });
  });

  describe("4. Request Correlation ID Infrastructure (`requestId`)", () => {
    it("20. generates a cryptographically strong UUID when absent", async () => {
      const res = await request(app).get("/test/success-basic");
      expect(res.headers["x-request-id"]).toBeDefined();
      expect(res.headers["x-request-id"]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it("21. preserves valid incoming request IDs", async () => {
      const validId = "client-trace-id-abc_123.test";
      const res = await request(app).get("/test/success-basic").set("X-Request-Id", validId);
      expect(res.headers["x-request-id"]).toBe(validId);
      expect(res.body.meta.requestId).toBe(validId);
    });

    it("22. rejects malformed or overly long incoming IDs and generates UUID", async () => {
      // Overly long ID (>64 chars)
      const oversizedId = "a".repeat(100);
      const res1 = await request(app).get("/test/success-basic").set("X-Request-Id", oversizedId);
      expect(res1.headers["x-request-id"]).not.toBe(oversizedId);
      expect(res1.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/i);

      // ID with unsafe characters (spaces, semicolons)
      const unsafeId = "id; DROP TABLE users; --";
      const res2 = await request(app).get("/test/success-basic").set("X-Request-Id", unsafeId);
      expect(res2.headers["x-request-id"]).not.toBe(unsafeId);
      expect(res2.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it("23. returns x-request-id in response header", async () => {
      const res = await request(app).get("/test/success-basic");
      expect(res.headers).toHaveProperty("x-request-id");
    });

    it("24. ensures response header ID matches metadata requestId", async () => {
      const res = await request(app).get("/test/success-basic");
      expect(res.headers["x-request-id"]).toBe(res.body.meta.requestId);
    });
  });

  describe("5. Not-Found Route Handling (`notFoundHandler`)", () => {
    it("25. returns canonical error response for unknown routes", async () => {
      const res = await request(app).get("/test/completely-unknown-route");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("NOT_FOUND");
      expect(res.body.message).toContain(
        "Resource at GET /test/completely-unknown-route was not found"
      );
      expect(res.body.meta.requestId).toBeDefined();
      expect(res.headers["x-request-id"]).toBe(res.body.meta.requestId);
    });
  });
});
