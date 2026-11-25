import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfileAction } from "../actions/profile.actions";
import { createAddressAction, updateAddressAction } from "../actions/address.actions";
import { markNotificationReadAction } from "../actions/notification.actions";
import { POST } from "../app/api/internal/cache/revalidate/route";
import { NextRequest } from "next/server";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("Task 14 — Server Actions & Cache Revalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Web Server Actions — Input Validation", () => {
    it("updateProfileAction rejects invalid payload with structured VALIDATION_ERROR", async () => {
      const result = await updateProfileAction({
        firstName: "", // Empty string violates min(1)
        phone: "invalid-phone-string-xyz",
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.firstName).toBeDefined();
      expect(result.fieldErrors?.phone).toBeDefined();
    });

    it("createAddressAction rejects incomplete address data", async () => {
      // @ts-expect-error Testing invalid runtime input
      const result = await createAddressAction({
        firstName: "",
        city: "",
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.fieldErrors).toBeDefined();
    });

    it("updateAddressAction rejects empty addressId", async () => {
      const result = await updateAddressAction("", {
        city: "Mumbai",
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_IDENTIFIER");
    });

    it("markNotificationReadAction rejects empty notification ID", async () => {
      const result = await markNotificationReadAction("");

      expect(result.success).toBe(false);
      expect(result.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Internal Cache Revalidation Route Handler (/api/internal/cache/revalidate)", () => {
    const validSecret = "veyora_internal_revalidation_secret_dev";

    it("rejects request without internal secret with HTTP 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/internal/cache/revalidate", {
        method: "POST",
        body: JSON.stringify({
          event: "inventory:adjusted",
          tags: ["catalog:products"],
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("rejects request with invalid secret with HTTP 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/internal/cache/revalidate", {
        method: "POST",
        headers: {
          "x-internal-cache-secret": "wrong_secret_123",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event: "inventory:adjusted",
          tags: ["catalog:products"],
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it("rejects non-allowlisted tags with HTTP 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/internal/cache/revalidate", {
        method: "POST",
        headers: {
          "x-internal-cache-secret": validSecret,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event: "malicious:attack",
          tags: ["user:passwords", "arbitrary:tag"],
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Forbidden tag families rejected");
    });

    it("successfully revalidates allowlisted catalog tags with HTTP 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/internal/cache/revalidate", {
        method: "POST",
        headers: {
          "x-internal-cache-secret": validSecret,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event: "inventory:adjusted",
          tags: ["catalog:products", "catalog:product:sku-12345", "catalog:categories"],
          profile: "max",
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.revalidated).toEqual([
        "catalog:products",
        "catalog:product:sku-12345",
        "catalog:categories",
      ]);
    });
  });
});
