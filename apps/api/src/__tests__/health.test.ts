import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

describe("Health API Endpoints", () => {
  const app = createApp();

  it("GET /health returns 200 with basic health metrics", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("service", "@veyora/api");
    expect(res.body.data).toHaveProperty("uptime");
    expect(res.body.data).toHaveProperty("memory");
  });

  it("GET /health/live returns 200 alive confirmation", async () => {
    const res = await request(app).get("/health/live");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "alive");
    expect(res.body).toHaveProperty("uptime");
  });

  it("GET /health/ready returns status checks for dependencies", async () => {
    const res = await request(app).get("/health/ready");
    // Returns 200 if connected, or 503 if test DB not running (both are valid structured readiness responses)
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("checks");
    expect(res.body.checks).toHaveProperty("mongodb");
    expect(res.body.checks).toHaveProperty("redis");
  });
});
