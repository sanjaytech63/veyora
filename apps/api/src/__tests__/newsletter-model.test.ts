import { describe, expect, it } from "vitest";
import { NewsletterSubscriptionModel } from "../modules/newsletter/models/newsletter-subscription.model";

describe("Newsletter subscription model", () => {
  it("normalizes and uniquely indexes normalized email addresses", () => {
    const normalizedEmailPath = NewsletterSubscriptionModel.schema.path("normalizedEmail");
    expect(normalizedEmailPath.options.lowercase).toBe(true);
    expect(normalizedEmailPath.options.trim).toBe(true);
    expect(normalizedEmailPath.options.unique).toBe(true);
  });

  it("defines lifecycle status and consent fields", () => {
    expect(NewsletterSubscriptionModel.schema.path("status").options.enum).toEqual([
      "pending",
      "active",
      "unsubscribed",
    ]);
    expect(NewsletterSubscriptionModel.schema.path("consentAt").isRequired).toBe(true);
  });

  it("indexes status and creation time for lifecycle queries", () => {
    const indexes = NewsletterSubscriptionModel.schema.indexes();
    expect(indexes.some(([keys]) => keys.status === 1 && keys.createdAt === -1)).toBe(true);
  });
});
