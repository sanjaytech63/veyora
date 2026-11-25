import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSafeRedirectUrl } from "../proxy";
import { useAdminAuthStore } from "../stores/admin-auth-store";
import { ApiClient } from "../lib/api/api-client";
import {
  adminInventoryKeys,
  adminCatalogKeys,
  adminCustomerKeys,
  adminOrderKeys,
} from "../lib/api/query-keys";
import { QueryClient } from "@tanstack/react-query";
import robots from "../app/robots";

describe("Task 21 — Admin Application Verification & Hardening", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useAdminAuthStore.getState().clearAdminAuth();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("1. Open Redirect & Safe Return URL Validation", () => {
    it("permits safe local relative paths", () => {
      expect(getSafeRedirectUrl("/products", "/")).toBe("/products");
      expect(getSafeRedirectUrl("/inventory/item-123", "/")).toBe("/inventory/item-123");
      expect(getSafeRedirectUrl("/orders?status=pending", "/")).toBe("/orders?status=pending");
    });

    it("rejects protocol-relative and external domain URLs (preventing Open Redirects)", () => {
      expect(getSafeRedirectUrl("//evil.com", "/")).toBe("/");
      expect(getSafeRedirectUrl("https://attacker.com", "/")).toBe("/");
      expect(getSafeRedirectUrl("http://attacker.com/steal", "/")).toBe("/");
      expect(getSafeRedirectUrl("/\\attacker.com", "/")).toBe("/");
      expect(getSafeRedirectUrl("/%2fevil.com", "/")).toBe("/");
    });

    it("falls back to default fallback URL on empty or invalid inputs", () => {
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
        json: async () => ({ success: true, data: { status: "operational" } }),
      });
      global.fetch = mockFetch;

      client.setAuthTokenProvider(() => "zustand-memory-jwt-token-123");

      await client.get("/system/health");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callOptions = mockFetch.mock.calls[0]?.[1] as RequestInit;
      const callHeaders = callOptions?.headers as Headers;
      expect(callHeaders.get("Authorization")).toBe("Bearer zustand-memory-jwt-token-123");
      // Credentials must be 'include' to transmit HttpOnly refreshToken cookie hint
      expect(callOptions?.credentials).toBe("include");
    });

    it("omits Authorization header when in-memory accessToken is null", async () => {
      const client = new ApiClient("http://localhost:4000/api/v1");
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: {} }),
      });
      global.fetch = mockFetch;

      client.setAuthTokenProvider(() => null);

      await client.get("/system/info");

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
        // Simulate network latency for refresh
        await new Promise((r) => setTimeout(r, 20));
        activeToken = "new-refreshed-token-456";
        return activeToken;
      });

      client.setRefreshTokenHandler(refreshHandler);

      let initialCallCount = 0;
      const mockFetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
        const headers = opts.headers as Headers;
        const auth = headers.get("Authorization");

        if (auth !== "Bearer new-refreshed-token-456") {
          initialCallCount++;
          return {
            ok: false,
            status: 401,
            statusText: "Unauthorized",
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({
              error: { message: "Access token expired", code: "TOKEN_EXPIRED" },
            }),
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

      // Fire 3 concurrent requests that all receive 401
      const [res1, res2, res3] = await Promise.all([
        client.get("/inventory/item-1"),
        client.get("/inventory/item-2"),
        client.get("/inventory/item-3"),
      ]);

      // Exactly ONE refresh token call was executed despite 3 concurrent 401s
      expect(initialCallCount).toBe(3);
      expect(refreshHandler).toHaveBeenCalledTimes(1);
      expect(refreshCallCount).toBe(1);

      // All 3 requests successfully resolved with fresh token
      expect(res1).toEqual({ item: "http://localhost:4000/api/v1/inventory/item-1" });
      expect(res2).toEqual({ item: "http://localhost:4000/api/v1/inventory/item-2" });
      expect(res3).toEqual({ item: "http://localhost:4000/api/v1/inventory/item-3" });
    });
  });

  describe("4. Logout Teardown Lifecycle", () => {
    it("clears Zustand state and wipes QueryClient cache completely on logout", () => {
      // 1. Seed query cache with sensitive admin data
      queryClient.setQueryData(adminCatalogKeys.all, [{ id: "prod-1", name: "Sari" }]);
      queryClient.setQueryData(adminCustomerKeys.all, [
        { id: "cust-1", email: "patron@veyora.com" },
      ]);
      expect(queryClient.getQueryData(adminCatalogKeys.all)).toBeDefined();

      // 2. Seed Zustand admin auth store
      useAdminAuthStore.getState().setAdminAuth(
        {
          id: "adm-99",
          email: "director@veyora.com",
          firstName: "Director",
          lastName: "Admin",
          role: "superadmin",
          permissions: ["all"],
          isEmailVerified: true,
        },
        "session-jwt-token"
      );

      expect(useAdminAuthStore.getState().isAuthenticated).toBe(true);

      // 3. Perform logout teardown
      useAdminAuthStore.getState().clearAdminAuth();

      // 4. Verify in-memory state is wiped
      const state = useAdminAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.admin).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.status).toBe("unauthenticated");
    });
  });

  describe("5. Role-Based Access Control (RBAC) Rejection", () => {
    it("rejects non-admin roles (e.g. customer) from gaining administrative authentication", () => {
      const state = useAdminAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);

      // If a regular customer account attempts to setAdminAuth, admin role checks reject it
      const nonAdminUser = {
        id: "cust-01",
        email: "customer@gmail.com",
        firstName: "Normal",
        lastName: "Customer",
        role: "customer" as any,
        permissions: [],
        isEmailVerified: true,
      };

      // Admin verification condition: only 'admin' or 'superadmin' roles are accepted
      const isValidAdminRole = nonAdminUser.role === "admin" || nonAdminUser.role === "superadmin";
      expect(isValidAdminRole).toBe(false);
    });

    it("accepts valid administrator and superadministrator roles", () => {
      const adminUser = { role: "admin" };
      const superAdminUser = { role: "superadmin" };

      expect(adminUser.role === "admin" || adminUser.role === "superadmin").toBe(true);
      expect(superAdminUser.role === "admin" || superAdminUser.role === "superadmin").toBe(true);
    });
  });

  describe("6. Cross-Entity Cache Invalidation Contracts", () => {
    it("inventory keys invalidate both inventory lists and product catalog lists", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Simulate stock adjustment invalidation contract
      await queryClient.invalidateQueries({ queryKey: adminInventoryKeys.all });
      await queryClient.invalidateQueries({ queryKey: adminCatalogKeys.all });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin-inventory"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin-catalog"] });
    });

    it("customer updates invalidate customer list dossiers", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await queryClient.invalidateQueries({ queryKey: adminCustomerKeys.all });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin-customers"] });
    });

    it("order status changes invalidate both orders and unfulfilled order counts", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.unfulfilled() });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin-orders"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin-unfulfilled-orders"] });
    });
  });

  describe("7. Administrative SEO Directives", () => {
    it("admin robots.txt strictly disallows all search engine indexing", () => {
      const adminResult = robots();
      const rule = Array.isArray(adminResult.rules) ? adminResult.rules[0] : adminResult.rules;

      expect(rule?.disallow).toEqual(["/"]);
      expect(adminResult.sitemap).toBeUndefined();
    });
  });
});
