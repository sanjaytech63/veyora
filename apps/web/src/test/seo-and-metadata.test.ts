import { describe, it, expect, vi, beforeEach } from "vitest";
import { siteConfig, getCanonicalUrl, normalizeCanonicalPath } from "@/config/site";
import { safeJsonLdReplacer } from "@/components/storefront/json-ld";
import webRobots from "@/app/robots";
import adminRobots from "../../../admin/src/app/robots";
import sitemap from "@/app/sitemap";
import { generateMetadata as generateProductMetadata } from "@/app/products/[slug]/page";
import { generateMetadata as generateCollectionMetadata } from "@/app/collections/[slug]/page";
import { generateMetadata as generateCategoryMetadata } from "@/app/category/[slug]/page";
import { generateMetadata as generateSearchMetadata } from "@/app/search/page";
import { metadata as rootMetadata } from "@/app/layout";
import * as catalogCache from "@/lib/cache/catalog-cache";
import type { Product, Category, Collection } from "@veyora/types";

// Mock cache layer
vi.mock("@/lib/cache/catalog-cache", () => ({
  getCachedProducts: vi.fn(),
  getCachedProductBySlug: vi.fn(),
  getCachedCategories: vi.fn(),
  getCachedCategoryBySlug: vi.fn(),
  getCachedCollections: vi.fn(),
  getCachedCollectionBySlug: vi.fn(),
}));

describe("Task 19 — Metadata, SEO & Search Engine Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Centralized Site Configuration & Brand Foundation", () => {
    it("defines the canonical brand name as 'Veyora'", () => {
      expect(siteConfig.brandName).toBe("Veyora");
      expect(siteConfig.name).toBe("Veyora");
    });

    it("defines the brand tagline as 'Shop smarter. Live better.'", () => {
      expect(siteConfig.tagline).toBe("Shop smarter. Live better.");
    });

    it("defines default title and title template with %s | Veyora", () => {
      expect(siteConfig.defaultTitle).toBe("Veyora — Shop smarter. Live better.");
      expect(siteConfig.titleTemplate).toBe("%s | Veyora");
    });

    it("generates clean canonical URLs stripping query parameters and hashes", () => {
      const canonical = getCanonicalUrl("/shop?page=2&sort=price_asc#filters");
      expect(canonical).toBe(`${siteConfig.url}/shop`);
    });

    it("normalizes root and trailing slashes correctly", () => {
      expect(getCanonicalUrl("/")).toBe(`${siteConfig.url}`);
      expect(getCanonicalUrl("/collections/")).toBe(`${siteConfig.url}/collections`);
      expect(normalizeCanonicalPath("/category/women/?sort=desc")).toBe("/category/women");
    });
  });

  describe("2. Root Layout Metadata Architecture", () => {
    it("configures metadataBase with a valid absolute URL", () => {
      expect(rootMetadata.metadataBase).toBeInstanceOf(URL);
      expect(rootMetadata.metadataBase?.toString()).toBe(`${siteConfig.url}/`);
    });

    it("sets title with default and template matching brand standards", () => {
      expect(rootMetadata.title).toEqual({
        default: "Veyora — Shop smarter. Live better.",
        template: "%s | Veyora",
      });
    });

    it("configures OpenGraph and Twitter cards with absolute assets", () => {
      const og = rootMetadata.openGraph as Record<string, unknown> | undefined;
      const tw = rootMetadata.twitter as Record<string, unknown> | undefined;
      expect(og?.siteName).toBe("Veyora");
      expect(og?.type).toBe("website");
      expect(tw?.card).toBe("summary_large_image");
    });

    it("allows search indexing for public storefront entry points", () => {
      expect(rootMetadata.robots).toEqual(
        expect.objectContaining({
          index: true,
          follow: true,
        })
      );
    });
  });

  describe("3. Robots & Crawling Directives", () => {
    it("storefront robots.txt allows public routes and disallows sensitive/private routes", () => {
      const robotsResult = webRobots();
      expect(robotsResult.rules).toBeDefined();

      const rule = Array.isArray(robotsResult.rules) ? robotsResult.rules[0] : robotsResult.rules;

      expect(rule?.allow).toContain("/");
      expect(rule?.disallow).toEqual(
        expect.arrayContaining([
          "/admin",
          "/checkout",
          "/cart",
          "/account",
          "/profile",
          "/orders",
          "/search",
          "/login",
          "/register",
        ])
      );
      expect(robotsResult.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    });

    it("admin robots.txt strictly disallows all search engine indexing", () => {
      const adminResult = adminRobots();
      const rule = Array.isArray(adminResult.rules) ? adminResult.rules[0] : adminResult.rules;

      expect(rule?.disallow).toEqual(["/"]);
      expect(adminResult.sitemap).toBeUndefined();
    });
  });

  describe("4. XML Sitemap Generation", () => {
    it("generates sitemap with static storefront routes, collections, categories, and products", async () => {
      vi.mocked(catalogCache.getCachedProducts).mockResolvedValueOnce([
        {
          id: "prod-1",
          slug: "cashmere-overcoat",
          title: "Cashmere Overcoat",
          updatedAt: "2026-03-01T00:00:00.000Z",
        } as unknown as Product,
      ]);
      vi.mocked(catalogCache.getCachedCategories).mockResolvedValueOnce([
        {
          id: "cat-1",
          slug: "outerwear",
          name: "Outerwear",
          updatedAt: "2026-03-01T00:00:00.000Z",
        } as unknown as Category,
      ]);
      vi.mocked(catalogCache.getCachedCollections).mockResolvedValueOnce([
        {
          id: "col-1",
          slug: "winter-solstice",
          name: "Winter Solstice",
          updatedAt: "2026-03-01T00:00:00.000Z",
        } as unknown as Collection,
      ]);

      const items = await sitemap();
      const urls = items.map((i) => i.url);

      // Verify static routes
      expect(urls).toContain(`${siteConfig.url}`);
      expect(urls).toContain(`${siteConfig.url}/shop`);
      expect(urls).toContain(`${siteConfig.url}/collections`);
      expect(urls).toContain(`${siteConfig.url}/new-arrivals`);

      // Verify dynamic catalog routes
      expect(urls).toContain(`${siteConfig.url}/products/cashmere-overcoat`);
      expect(urls).toContain(`${siteConfig.url}/category/outerwear`);
      expect(urls).toContain(`${siteConfig.url}/collections/winter-solstice`);

      // Verify search is strictly EXCLUDED from sitemap
      expect(urls).not.toContain(`${siteConfig.url}/search`);
    });

    it("gracefully falls back to static routes if catalog cache fails", async () => {
      vi.mocked(catalogCache.getCachedProducts).mockRejectedValueOnce(
        new Error("Backend unreachable")
      );
      vi.mocked(catalogCache.getCachedCategories).mockRejectedValueOnce(
        new Error("Backend unreachable")
      );
      vi.mocked(catalogCache.getCachedCollections).mockRejectedValueOnce(
        new Error("Backend unreachable")
      );

      const items = await sitemap();
      const urls = items.map((i) => i.url);

      expect(urls).toContain(`${siteConfig.url}`);
      expect(urls).toContain(`${siteConfig.url}/shop`);
      expect(urls).toHaveLength(4);
    });
  });

  describe("5. Dynamic Catalog Route Metadata", () => {
    it("generates product metadata with canonical URL and OpenGraph image", async () => {
      vi.mocked(catalogCache.getCachedProductBySlug).mockResolvedValueOnce({
        id: "prod-2",
        slug: "linen-blazer",
        title: "Tailored Linen Blazer",
        description: "Bespoke tailored summer linen blazer.",
        images: [{ url: "https://res.cloudinary.com/veyora/blazer.jpg" }],
        seo: {
          metaTitle: "Luxury Tailored Linen Blazer",
          metaDescription: "Lightweight and breathable pure linen blazer.",
        },
      } as unknown as Product);

      const meta = await generateProductMetadata({
        params: Promise.resolve({ slug: "linen-blazer" }),
      });

      expect(meta.title).toBe("Luxury Tailored Linen Blazer");
      expect(meta.description).toBe("Lightweight and breathable pure linen blazer.");
      expect(meta.alternates?.canonical).toBe(`${siteConfig.url}/products/linen-blazer`);
      expect(meta.openGraph?.url).toBe(`${siteConfig.url}/products/linen-blazer`);
    });

    it("returns noindex when product is not found", async () => {
      vi.mocked(catalogCache.getCachedProductBySlug).mockResolvedValueOnce(null);

      const meta = await generateProductMetadata({
        params: Promise.resolve({ slug: "non-existent" }),
      });

      expect(meta.title).toBe("Product Not Found");
      expect(meta.robots).toEqual(
        expect.objectContaining({
          index: false,
          follow: false,
        })
      );
    });

    it("generates collection metadata with canonical URL and lookbook details", async () => {
      vi.mocked(catalogCache.getCachedCollectionBySlug).mockResolvedValueOnce({
        id: "col-2",
        slug: "autumn-monochrome",
        name: "Autumn Monochrome",
        description: "Monochromatic essentials tailored for quiet luxury.",
        image: "https://res.cloudinary.com/veyora/autumn.jpg",
      } as unknown as Collection);

      const meta = await generateCollectionMetadata({
        params: Promise.resolve({ slug: "autumn-monochrome" }),
      });

      expect(meta.title).toBe("Autumn Monochrome | Curated Collections");
      expect(meta.alternates?.canonical).toBe(`${siteConfig.url}/collections/autumn-monochrome`);
      expect(meta.openGraph?.images).toEqual([
        expect.objectContaining({ url: "https://res.cloudinary.com/veyora/autumn.jpg" }),
      ]);
    });

    it("generates category metadata with canonical URL", async () => {
      vi.mocked(catalogCache.getCachedCategoryBySlug).mockResolvedValueOnce({
        id: "cat-2",
        slug: "knitwear",
        name: "Knitwear",
        description: "Fine gauge merino and cashmere knitwear.",
      } as unknown as Category);

      const meta = await generateCategoryMetadata({
        params: Promise.resolve({ slug: "knitwear" }),
      });

      expect(meta.title).toBe("Knitwear | Category");
      expect(meta.alternates?.canonical).toBe(`${siteConfig.url}/category/knitwear`);
    });

    it("search page metadata enforces noindex to prevent duplicate content indexing", async () => {
      const meta = await generateSearchMetadata({
        searchParams: Promise.resolve({ q: "summer dress" }),
      });

      expect(meta.title).toBe('Search: "summer dress"');
      expect(meta.robots).toEqual(
        expect.objectContaining({
          index: false,
          follow: false,
        })
      );
    });
  });

  describe("6. Structured Data (JSON-LD) Security & Integrity", () => {
    it("safely escapes '<' characters in JSON-LD output to prevent script breakout XSS", () => {
      const maliciousPayload = {
        title: 'Malicious </script><script>alert("XSS")</script>',
        description: "Safe text with <tag> and special chars",
      };

      const serialized = safeJsonLdReplacer(maliciousPayload);

      expect(serialized).not.toContain("</script>");
      expect(serialized).not.toContain("<tag>");
      expect(serialized).toContain("\\u003c/script>");
      expect(serialized).toContain("\\u003ctag>");
      // Verify valid JSON parses back to original text
      expect(JSON.parse(serialized)).toEqual(maliciousPayload);
    });
  });
});
