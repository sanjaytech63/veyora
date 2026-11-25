import { describe, it, expect, vi, beforeEach } from "vitest";

interface TestCookieStore {
  get(name: string): { value: string } | undefined;
}

// Strict Next.js 16 runtime simulation: Calling cookies() inside "use cache" throws!
const mockCookies = vi.fn<() => Promise<TestCookieStore>>(() => {
  throw new Error(
    "Route '/': cookies() can't be read inside 'use cache'. Read it outside the cached function."
  );
});

vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

// Mock next/cache primitives
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { serverCatalog, serverFetch } from "../lib/api/server-api-client";
import {
  getCachedCategories,
  getCachedCollections,
  getCachedProducts,
  getCachedFeaturedProducts,
} from "../lib/cache/catalog-cache";

describe("Next.js 16 'use cache' Compliance & Runtime Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, data: [] }),
    });
  });

  describe("Cached Catalog Functions ('use cache' Runtime Safety)", () => {
    it("getCachedCategories() completes without triggering Next.js cookies() error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          success: true,
          data: [{ id: "cat-1", name: "Kurtis", slug: "kurtis" }],
        }),
      });

      // If cookies() is called, this will reject with the Next.js 16 runtime error
      const categories = await getCachedCategories();

      expect(categories).toHaveLength(1);
      expect(categories[0]?.name).toBe("Kurtis");
      expect(mockCookies).not.toHaveBeenCalled();
    });

    it("getCachedCollections() completes without triggering cookies() error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          success: true,
          data: [{ id: "col-1", name: "Festive Edit", slug: "festive-edit" }],
        }),
      });

      const collections = await getCachedCollections();
      expect(collections).toHaveLength(1);
      expect(mockCookies).not.toHaveBeenCalled();
    });

    it("getCachedProducts() completes without triggering cookies() error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          success: true,
          data: [{ id: "prod-1", name: "Silk Chanderi Kurti", slug: "silk-chanderi" }],
        }),
      });

      const products = await getCachedProducts({ limit: 8 });
      expect(products).toHaveLength(1);
      expect(mockCookies).not.toHaveBeenCalled();
    });

    it("getCachedFeaturedProducts() completes without triggering cookies() error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          success: true,
          data: [
            { id: "p-1", name: "P1", status: "active", tags: ["featured"] },
            { id: "p-2", name: "P2", status: "active", tags: ["featured"] },
          ],
        }),
      });

      const featured = await getCachedFeaturedProducts(2);
      expect(featured).toHaveLength(2);
      expect(mockCookies).not.toHaveBeenCalled();
    });
  });

  describe("Domain serverCatalog Direct Invocations", () => {
    it("serverCatalog.getCategories does NOT read cookies()", async () => {
      await serverCatalog.getCategories();
      expect(mockCookies).not.toHaveBeenCalled();
    });

    it("serverCatalog.getProducts does NOT read cookies()", async () => {
      await serverCatalog.getProducts({ limit: 4 });
      expect(mockCookies).not.toHaveBeenCalled();
    });

    it("serverFetch without requireAuth does NOT read cookies()", async () => {
      await serverFetch("/brands");
      expect(mockCookies).not.toHaveBeenCalled();
    });

    it("serverFetch with explicit token does NOT read cookies()", async () => {
      await serverFetch("/user/profile", { token: "explicit-token-123", requireAuth: true });
      expect(mockCookies).not.toHaveBeenCalled();
    });
  });

  describe("Authenticated Endpoints", () => {
    it("serverFetch with requireAuth and no token reads cookies()", async () => {
      mockCookies.mockResolvedValueOnce({
        get: (key: string) => {
          if (key === "refreshToken") return { value: "mock-refresh-token" };
          return undefined;
        },
      });

      await serverFetch("/protected/data", { requireAuth: true });
      expect(mockCookies).toHaveBeenCalled();
    });
  });
});
