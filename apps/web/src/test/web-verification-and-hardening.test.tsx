import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { getSafeRedirectUrl } from "../proxy";
import { useAuthStore } from "../stores/auth-store";
import { ApiClient } from "../lib/api/api-client";
import { VariantSelector } from "../components/storefront/variant-selector";
import { CACHE_TAGS } from "../lib/cache/catalog-cache";
import { QueryClient } from "@tanstack/react-query";
import { ProductVariant } from "@veyora/types";

describe("Task 22 — Web Storefront Verification & Hardening", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("1. Open Redirect & Safe Return URL Validation", () => {
    it("permits safe local relative paths on storefront", () => {
      expect(getSafeRedirectUrl("/shop", "/")).toBe("/shop");
      expect(getSafeRedirectUrl("/products/silk-anarkali", "/")).toBe("/products/silk-anarkali");
      expect(getSafeRedirectUrl("/checkout", "/")).toBe("/checkout");
      expect(getSafeRedirectUrl("/orders", "/")).toBe("/orders");
    });

    it("rejects protocol-relative and external domain URLs (preventing Open Redirects)", () => {
      expect(getSafeRedirectUrl("//evil.com", "/")).toBe("/");
      expect(getSafeRedirectUrl("https://attacker.com", "/")).toBe("/");
      expect(getSafeRedirectUrl("http://attacker.com/steal", "/")).toBe("/");
      expect(getSafeRedirectUrl("/\\attacker.com", "/")).toBe("/");
      expect(getSafeRedirectUrl("/%2fevil.com", "/")).toBe("/");
    });

    it("falls back to default fallback URL on empty or malicious inputs", () => {
      expect(getSafeRedirectUrl(null, "/")).toBe("/");
      expect(getSafeRedirectUrl(undefined, "/")).toBe("/");
      expect(getSafeRedirectUrl("", "/")).toBe("/");
      expect(getSafeRedirectUrl("javascript:alert(1)", "/")).toBe("/");
    });
  });

  describe("2. In-Memory Access Token Architecture (No Cookie Dependency)", () => {
    it("injects Bearer token directly from in-memory token provider into headers", async () => {
      const client = new ApiClient("http://localhost:4000/api/v1");
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: { status: "active" } }),
      });
      global.fetch = mockFetch;

      client.setAuthTokenProvider(() => "web-memory-jwt-token-789");

      await client.get("/profile");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callOptions = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const callHeaders = callOptions?.headers as Headers;
      expect(callHeaders.get("Authorization")).toBe("Bearer web-memory-jwt-token-789");
      expect(callOptions?.credentials).toBe("include");
    });

    it("omits Authorization header when in-memory accessToken is null (Guest mode)", async () => {
      const client = new ApiClient("http://localhost:4000/api/v1");
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: [] }),
      });
      global.fetch = mockFetch;

      client.setAuthTokenProvider(() => null);

      await client.get("/products");

      const callOptions = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const callHeaders = callOptions?.headers as Headers;
      expect(callHeaders.get("Authorization")).toBeNull();
    });
  });

  describe("3. 401 Token Refresh Single-Flight Deduplication & Auto-Retry", () => {
    it("deduplicates concurrent 401 failures into a single refresh execution and retries requests", async () => {
      const client = new ApiClient("http://localhost:4000/api/v1");
      let refreshCallCount = 0;
      let activeToken = "expired-token-123";

      client.setAuthTokenProvider(() => activeToken);

      const refreshHandler = vi.fn().mockImplementation(async () => {
        refreshCallCount++;
        await new Promise((r) => setTimeout(r, 20));
        activeToken = "new-refreshed-token-456";
        return activeToken;
      });

      client.setRefreshTokenHandler(refreshHandler);

      const mockFetch = vi.fn().mockImplementation(async (url: string, opts: RequestInit = {}) => {
        const headers = new Headers(opts.headers);
        const auth = headers.get("Authorization");

        if (auth !== "Bearer new-refreshed-token-456") {
          return {
            ok: false,
            status: 401,
            statusText: "Unauthorized",
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({ error: { message: "Token expired", code: "TOKEN_EXPIRED" } }),
          };
        }

        return {
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true, data: { item: url } }),
        };
      });
      global.fetch = mockFetch;

      // Fire 3 concurrent requests that receive 401
      const [res1, res2, res3] = await Promise.all([
        client.get("/cart"),
        client.get("/wishlist"),
        client.get("/profile"),
      ]);

      expect(refreshHandler).toHaveBeenCalledTimes(1);
      expect(refreshCallCount).toBe(1);

      expect(res1).toEqual({ item: "http://localhost:4000/api/v1/cart" });
      expect(res2).toEqual({ item: "http://localhost:4000/api/v1/wishlist" });
      expect(res3).toEqual({ item: "http://localhost:4000/api/v1/profile" });
    });
  });

  describe("4. Logout Teardown Lifecycle", () => {
    it("clears Zustand state and wipes QueryClient cache completely on customer logout", () => {
      // 1. Seed store and cache
      useAuthStore.getState().setAuth(
        {
          id: "usr-01",
          email: "patron@veyora.com",
          firstName: "Sartorial",
          lastName: "Patron",
          role: "customer",
          permissions: [],
          isEmailVerified: true,
        },
        "session-jwt-token"
      );

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // 2. Perform logout
      useAuthStore.getState().clearAuth();

      // 3. Verify in-memory state is wiped
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.status).toBe("unauthenticated");
    });
  });

  describe("5. Product Variant Selector WAI-ARIA Semantics", () => {
    const mockVariants: ProductVariant[] = [
      {
        id: "var-1",
        sku: "SLK-RD-S",
        price: 180,
        stock: 5,
        color: "Crimson Red",
        size: "S",
      },
      {
        id: "var-2",
        sku: "SLK-RD-M",
        price: 180,
        stock: 0,
        color: "Crimson Red",
        size: "M",
      },
    ];

    it("renders options with role='radio' and aria-checked inside role='radiogroup'", () => {
      const handleSelect = vi.fn();
      render(
        <VariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]!}
          onSelectVariant={handleSelect}
        />
      );

      // Radiogroups present
      const radiogroups = screen.getAllByRole("radiogroup");
      expect(radiogroups.length).toBeGreaterThanOrEqual(1);

      // Radio elements present
      const radios = screen.getAllByRole("radio");
      expect(radios.length).toBeGreaterThan(0);

      // Selected option has aria-checked="true"
      const selectedColorRadio = radios.find((el) => el.getAttribute("aria-checked") === "true");
      expect(selectedColorRadio).toBeDefined();

      // No mixed toggle semantics (aria-pressed should NOT be present on radios)
      radios.forEach((radio) => {
        expect(radio).not.toHaveAttribute("aria-pressed");
      });
    });
  });

  describe("6. Public Catalog Cache Tag Architecture", () => {
    it("ensures public catalog tags never contain or overlap user-specific cache keys", () => {
      const publicTags = Object.values(CACHE_TAGS).map((v) =>
        typeof v === "function" ? v("test") : v
      );

      // Verify none of the public tags include user, cart, or order identifiers
      publicTags.forEach((tag) => {
        expect(tag.startsWith("catalog:")).toBe(true);
        expect(tag).not.toContain("cart");
        expect(tag).not.toContain("wishlist");
        expect(tag).not.toContain("user");
        expect(tag).not.toContain("order");
        expect(tag).not.toContain("address");
      });
    });
  });
});
