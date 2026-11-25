import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { createApp } from "../app";
import { errorHandler } from "../middleware/error-handler";
import { validateRequest } from "../middleware/validate-request";
import { idParamSchema, paginationQuerySchema, registerSchema } from "@veyora/validators";
import { z } from "zod";

describe("API Middleware Suite", () => {
  const app = createApp();

  // Create dedicated test app to verify validation middleware in isolation with error handler
  const validationApp = express();
  validationApp.use(express.json());
  validationApp.post(
    "/test-validation/:id",
    validateRequest({
      params: idParamSchema,
      query: paginationQuerySchema,
      body: registerSchema,
      headers: z.object({ "x-client-id": z.string().min(1) }).passthrough(),
    }),
    (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          params: req.params,
          query: req.query,
          body: req.body,
        },
      });
    }
  );
  validationApp.use(errorHandler);

  it("generates and attaches X-Request-Id header", async () => {
    const res = await request(app).get("/health");
    expect(res.headers).toHaveProperty("x-request-id");
    expect(typeof res.headers["x-request-id"]).toBe("string");
  });

  it("preserves incoming X-Request-Id if provided", async () => {
    const customId = "custom-trace-id-12345";
    const res = await request(app).get("/health").set("X-Request-Id", customId);
    expect(res.headers["x-request-id"]).toBe(customId);
  });

  it("returns 404 with structured error for unknown routes", async () => {
    const res = await request(app).get("/api/v1/unknown-endpoint-xyz");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.error).toHaveProperty("code", "NOT_FOUND");
    expect(res.body.error).toHaveProperty("message");
  });

  it("serves OpenAPI Swagger UI documentation at /docs", async () => {
    const res = await request(app).get("/docs/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Swagger UI");
  });

  describe("Centralized Zod Request Validation Middleware", () => {
    it("returns 422 with standardized error response when body fails validation", async () => {
      const res = await request(validationApp)
        .post("/test-validation/item-123")
        .set("x-client-id", "test-client")
        .send({
          email: "invalid-email",
          password: "short",
          firstName: "",
          lastName: "Doe",
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.message).toBe("Please review the submitted information.");

      // Verify standardized errors mapping
      expect(res.body).toHaveProperty("errors");
      expect(res.body.errors).toHaveProperty("email");
      expect(res.body.errors).toHaveProperty("password");
      expect(res.body.errors).toHaveProperty("firstName");
      expect(Array.isArray(res.body.errors.email)).toBe(true);
      expect(Array.isArray(res.body.errors.password)).toBe(true);
    });

    it("returns 422 when required header fails validation", async () => {
      const res = await request(validationApp)
        .post("/test-validation/item-123")
        // Missing x-client-id header
        .send({
          email: "valid@example.com",
          password: "ValidPassword123!",
          firstName: "John",
          lastName: "Doe",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.errors).toHaveProperty("x-client-id");
    });

    it("passes validation, performs coercion, and replaces raw inputs with transformed data", async () => {
      const res = await request(validationApp)
        .post("/test-validation/item-456?page=3&limit=15")
        .set("x-client-id", "test-client")
        .send({
          email: "  USER@Example.COM  ",
          password: "ValidPassword123!",
          firstName: "John",
          lastName: "Doe",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify query string numbers were coerced to integers
      expect(res.body.data.query.page).toBe(3);
      expect(res.body.data.query.limit).toBe(15);
      expect(res.body.data.query.sortOrder).toBe("desc"); // default value applied

      // Verify params
      expect(res.body.data.params.id).toBe("item-456");

      // Verify email was preprocessed (trimmed & lowercased)
      expect(res.body.data.body.email).toBe("user@example.com");
    });
  });
});
