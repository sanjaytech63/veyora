import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

describe("API Middleware Suite", () => {
  const app = createApp();

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
});
