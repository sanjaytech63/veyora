import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  InternalServerError,
  isAppError,
  slugify,
  capitalize,
  truncate,
  safeJsonParse,
  logger,
} from "../index";

describe("@veyora/utils Package Tests", () => {
  describe("1. Error Classes & Error Hierarchy", () => {
    it("creates standard AppError with defaults and custom properties", () => {
      const err = new AppError("Something went wrong");
      expect(err.message).toBe("Something went wrong");
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe("INTERNAL_SERVER_ERROR");
      expect(err.isOperational).toBe(true);
      expect(err.name).toBe("AppError");
      expect(err.stack).toBeDefined();

      const customErr = new AppError("Payment failed", 402, "PAYMENT_REQUIRED", [
        { message: "Card declined", field: "card" },
      ]);
      expect(customErr.statusCode).toBe(402);
      expect(customErr.code).toBe("PAYMENT_REQUIRED");
      expect(customErr.details).toHaveLength(1);
      expect(customErr.details?.[0]?.field).toBe("card");
    });

    it("instantiates NotFoundError with 404 status and NOT_FOUND code", () => {
      const notFound = new NotFoundError("Garment not found");
      expect(notFound.statusCode).toBe(404);
      expect(notFound.code).toBe("NOT_FOUND");
      expect(notFound.message).toBe("Garment not found");
      expect(notFound.isOperational).toBe(true);
    });

    it("instantiates BadRequestError with 400 status and BAD_REQUEST code", () => {
      const badReq = new BadRequestError("Invalid parameter");
      expect(badReq.statusCode).toBe(400);
      expect(badReq.code).toBe("BAD_REQUEST");
      expect(badReq.message).toBe("Invalid parameter");
    });

    it("instantiates UnauthorizedError with 401 status and UNAUTHORIZED code", () => {
      const unauth = new UnauthorizedError("Session expired");
      expect(unauth.statusCode).toBe(401);
      expect(unauth.code).toBe("UNAUTHORIZED");
    });

    it("instantiates ForbiddenError with 403 status and FORBIDDEN code", () => {
      const forbidden = new ForbiddenError("Insufficient permissions");
      expect(forbidden.statusCode).toBe(403);
      expect(forbidden.code).toBe("FORBIDDEN");
    });

    it("instantiates ConflictError with 409 status and CONFLICT code", () => {
      const conflict = new ConflictError("Email already exists");
      expect(conflict.statusCode).toBe(409);
      expect(conflict.code).toBe("CONFLICT");
    });

    it("instantiates ValidationError with 422 status and structured field errors", () => {
      const valErr = new ValidationError("Form validation error", undefined, {
        email: ["Must be a valid email"],
        password: ["Must be at least 8 characters"],
      });
      expect(valErr.statusCode).toBe(422);
      expect(valErr.code).toBe("VALIDATION_ERROR");
      expect(valErr.errors?.email).toContain("Must be a valid email");
      expect(valErr.errors?.password).toContain("Must be at least 8 characters");
    });

    it("instantiates InternalServerError with isOperational=false", () => {
      const internal = new InternalServerError("Database disk failure");
      expect(internal.statusCode).toBe(500);
      expect(internal.code).toBe("INTERNAL_SERVER_ERROR");
      expect(internal.isOperational).toBe(false);
    });

    it("correctly identifies AppError instances with isAppError type guard", () => {
      expect(isAppError(new AppError("generic"))).toBe(true);
      expect(isAppError(new NotFoundError())).toBe(true);
      expect(isAppError(new ValidationError())).toBe(true);
      expect(isAppError(new Error("plain error"))).toBe(false);
      expect(isAppError({ message: "fake", statusCode: 400 })).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError("string error")).toBe(false);
    });
  });

  describe("2. String & Data Transformation Utilities", () => {
    describe("slugify()", () => {
      it("creates url-safe slugs from various strings", () => {
        expect(slugify("Chanderi Silk Kurti")).toBe("chanderi-silk-kurti");
        expect(slugify("  Bandhani Dupatta & Lehengas!!  ")).toBe("bandhani-dupatta-lehengas");
        expect(slugify("Multi---hyphen___and   spaces")).toBe("multi-hyphen-and-spaces");
        expect(slugify("Special #$* Characters 123")).toBe("special-characters-123");
      });

      it("handles empty and single character strings", () => {
        expect(slugify("")).toBe("");
        expect(slugify("A")).toBe("a");
        expect(slugify("---")).toBe("");
      });
    });

    describe("capitalize()", () => {
      it("capitalizes the first letter of strings", () => {
        expect(capitalize("veyora")).toBe("Veyora");
        expect(capitalize("kurti")).toBe("Kurti");
        expect(capitalize("ALREADY")).toBe("ALREADY");
      });

      it("handles empty or falsy strings gracefully", () => {
        expect(capitalize("")).toBe("");
      });
    });

    describe("truncate()", () => {
      it("truncates strings longer than specified limit and adds ellipsis", () => {
        const text = "Handcrafted pure cotton Anarkali suit set with embroidery";
        expect(truncate(text, 20)).toBe("Handcrafted pure cot...");
      });

      it("returns original string if within limit", () => {
        expect(truncate("Veyora", 10)).toBe("Veyora");
        expect(truncate("Exact", 5)).toBe("Exact");
      });
    });

    describe("safeJsonParse()", () => {
      it("parses valid JSON string into typed data", () => {
        const result = safeJsonParse<{ name: string; price: number }>(
          '{"name":"Kurti","price":120}',
          { name: "", price: 0 }
        );
        expect(result.name).toBe("Kurti");
        expect(result.price).toBe(120);
      });

      it("returns fallback value when JSON is invalid", () => {
        const fallback = { status: "unknown" };
        const result = safeJsonParse("not-a-valid-json", fallback);
        expect(result).toBe(fallback);
      });
    });
  });

  describe("3. Structured Logger Utility", () => {
    let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("logs formatted info message with metadata", () => {
      logger.info("AUTH_SERVICE", "User logged in successfully", { userId: "user-123" });
      expect(consoleInfoSpy).toHaveBeenCalledOnce();

      const loggedString = consoleInfoSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(loggedString);
      expect(parsed.level).toBe("info");
      expect(parsed.tag).toBe("AUTH_SERVICE");
      expect(parsed.message).toBe("User logged in successfully");
      expect(parsed.meta.userId).toBe("user-123");
      expect(parsed.timestamp).toBeDefined();
    });

    it("logs formatted warning message", () => {
      logger.warn("STOCK_SERVICE", "Low inventory alert", { sku: "VYR-01", remaining: 2 });
      expect(consoleWarnSpy).toHaveBeenCalledOnce();

      const parsed = JSON.parse(consoleWarnSpy.mock.calls[0]?.[0] as string);
      expect(parsed.level).toBe("warn");
      expect(parsed.tag).toBe("STOCK_SERVICE");
      expect(parsed.message).toBe("Low inventory alert");
    });

    it("logs formatted error message", () => {
      logger.error("PAYMENT_SERVICE", "Payment gateway timeout", { orderId: "ord-99" });
      expect(consoleErrorSpy).toHaveBeenCalledOnce();

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0]?.[0] as string);
      expect(parsed.level).toBe("error");
      expect(parsed.tag).toBe("PAYMENT_SERVICE");
      expect(parsed.message).toBe("Payment gateway timeout");
      expect(parsed.meta.orderId).toBe("ord-99");
    });

    it("logs debug message when NODE_ENV is development", () => {
      const prevEnv = process.env["NODE_ENV"];
      process.env["NODE_ENV"] = "development";
      logger.debug("CACHE_SERVICE", "Cache key invalidated", { key: "cat:all" });
      expect(consoleDebugSpy).toHaveBeenCalledOnce();
      process.env["NODE_ENV"] = prevEnv;
    });

    it("automatically redacts passwords, tokens, secrets, and credit cards from logs", () => {
      logger.warn("SECURITY_AUDIT", "User submitted credentials", {
        password: "SuperSecretPassword123!",
        refreshToken: "eyJhbGciOi...",
        otp: "992812",
        creditCard: "4111-2222-3333-4444",
        safeMeta: "safe-value",
      });

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const parsed = JSON.parse(consoleWarnSpy.mock.calls[0]?.[0] as string);
      expect(parsed.meta.password).toBe("[REDACTED]");
      expect(parsed.meta.refreshToken).toBe("[REDACTED]");
      expect(parsed.meta.otp).toBe("[REDACTED]");
      expect(parsed.meta.creditCard).toBe("[REDACTED]");
      expect(parsed.meta.safeMeta).toBe("safe-value");
    });

    it("supports event-based object invocation and child loggers", () => {
      const child = logger.child({ service: "@veyora/worker", queue: "email" });
      child.info({
        event: "email.dispatched",
        recipient: "patron@veyora.com",
        orderId: "ord-4412",
      });

      expect(consoleInfoSpy).toHaveBeenCalledOnce();
      const parsed = JSON.parse(consoleInfoSpy.mock.calls[0]?.[0] as string);
      expect(parsed.tag).toBe("email.dispatched");
      expect(parsed.meta.service).toBe("@veyora/worker");
      expect(parsed.meta.queue).toBe("email");
      expect(parsed.meta.orderId).toBe("ord-4412");
    });
  });
});
