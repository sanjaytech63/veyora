import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const mockFindOneAndUpdate = vi.hoisted(() => vi.fn());

vi.mock("../modules/newsletter/models/newsletter-subscription.model", () => ({
  NewsletterSubscriptionModel: {
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

import { createApp } from "../app";

describe("Newsletter subscription API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOneAndUpdate.mockResolvedValue({ normalizedEmail: "patron@example.com" });
  });

  it("accepts and persists a valid consented subscription", async () => {
    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "  Patron@Example.com  ", consent: true });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.code).toBe("NEWSLETTER_SUBSCRIBED");
    expect(response.body.message).toBe(
      "Your newsletter subscription request was received and recorded."
    );
    expect(response.body.data).toEqual({ accepted: true, status: "pending" });
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { normalizedEmail: "patron@example.com" },
      expect.any(Object),
      expect.objectContaining({ upsert: true })
    );
  });

  it("rejects invalid email input", async () => {
    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "not-an-email", consent: true });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("requires explicit consent", async () => {
    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "patron@example.com", consent: false });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns the same safe success shape for duplicate submissions", async () => {
    const first = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "patron@example.com", consent: true });
    const second = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "PATRON@example.com", consent: true });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data).toEqual(first.body.data);
  });

  it("handles concurrent duplicate submissions atomically", async () => {
    const response = await Promise.all([
      request(app)
        .post("/api/v1/newsletter/subscribe")
        .send({ email: "concurrent@example.com", consent: true }),
      request(app)
        .post("/api/v1/newsletter/subscribe")
        .send({ email: "CONCURRENT@example.com", consent: true }),
    ]);

    expect(response.every((item) => item.status === 201)).toBe(true);
  });

  it("returns a safe canonical response for unknown persistence failures", async () => {
    mockFindOneAndUpdate.mockRejectedValueOnce(
      new Error("mongodb://internal credentials and stack details")
    );

    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "patron@example.com", consent: true });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).not.toContain("mongodb://");
  });
});
