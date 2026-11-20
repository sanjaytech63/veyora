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
});
