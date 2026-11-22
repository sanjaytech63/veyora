import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

describe("System API Endpoints", () => {
  const app = createApp();

  it("GET /api/v1/system/info returns system metadata", async () => {
    const res = await request(app).get("/api/v1/system/info");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("service", "@veyora/api");
    expect(res.body.data).toHaveProperty("version");
    expect(res.body.data).toHaveProperty("nodeVersion");
    expect(res.body.data).toHaveProperty("platform");
  });

  it("GET /api/v1/system/metrics returns Prometheus text exposition metrics", async () => {
    const res = await request(app).get("/api/v1/system/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("process_uptime_seconds");
    expect(res.text).toContain("process_heap_bytes");
    expect(res.text).toContain("veyora_database_connected");
    expect(res.text).toContain("veyora_build_info");
  });

  it("GET /metrics returns top-level Prometheus metrics", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("process_uptime_seconds");
  });
});
