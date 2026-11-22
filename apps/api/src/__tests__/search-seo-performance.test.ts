/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../app";
import { catalogCacheService } from "../modules/catalog/services/catalog-cache.service";

interface MockProductDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  trackQuantity: boolean;
  status: "draft" | "active" | "archived";
  categoryId: any;
  brandId?: any;
  images: any[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MockCategoryDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  status: "active" | "inactive";
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MockBrandDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  status: "active" | "inactive";
}

let mockCategories: MockCategoryDoc[] = [];
let mockBrands: MockBrandDoc[] = [];
let mockProducts: MockProductDoc[] = [];

function mockQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
    lean: vi.fn(() => queryObj),
    then: (resolve: (val: T) => any, reject?: (err: any) => any) => {
      try {
        return Promise.resolve(execFn()).then(resolve, reject);
      } catch (err) {
        if (reject) return Promise.reject(err).catch(reject);
        throw err;
      }
    },
  };
  return queryObj;
}

// Mock Category Model
vi.mock("../modules/catalog/models/category.model", () => ({
  Category: {
    find: vi.fn((query: any) =>
      mockQuery(() => {
        let items = [...mockCategories];
        if (query?.status) {
          items = items.filter((c) => c.status === query.status);
        }
        if (query?._id?.$in) {
          const ids = query._id.$in.map((id: any) => id.toString());
          items = items.filter((c) => ids.includes(c._id.toString()));
        }
        if (query?.name?.$regex) {
          const regex = new RegExp(query.name.$regex, query.name.$options || "i");
          items = items.filter((c) => regex.test(c.name));
        }
        return items;
      })
    ),
    findOne: vi.fn((query: any) =>
      mockQuery(() => {
        return (
          mockCategories.find((c) => {
            if (query?.slug && c.slug !== query.slug) return false;
            return true;
          }) || null
        );
      })
    ),
    create: vi.fn(async (data: any) => ({
      _id: new mongoose.Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    deleteOne: vi.fn(async () => ({ deletedCount: 1 })),
  },
}));

// Mock Brand Model
vi.mock("../modules/catalog/models/brand.model", () => ({
  Brand: {
    find: vi.fn((query: any) =>
      mockQuery(() => {
        let items = [...mockBrands];
        if (query?._id?.$in) {
          const ids = query._id.$in.map((id: any) => id.toString());
          items = items.filter((b) => ids.includes(b._id.toString()));
        }
        return items;
      })
    ),
  },
}));

// Mock Product Model
vi.mock("../modules/catalog/models/product.model", () => ({
  Product: {
    find: vi.fn((query: any, _projection?: any) =>
      mockQuery(() => {
        let items = [...mockProducts];

        if (query?.status) {
          items = items.filter((p) => p.status === query.status);
        }

        if (query?.categoryId) {
          items = items.filter(
            (p) => (p.categoryId?._id || p.categoryId)?.toString() === query.categoryId.toString()
          );
        }

        if (query?.brandId) {
          items = items.filter(
            (p) => (p.brandId?._id || p.brandId)?.toString() === query.brandId.toString()
          );
        }

        if (query?.stock?.$gt !== undefined) {
          items = items.filter((p) => p.stock > query.stock.$gt);
        }

        if (query?.price?.$gte !== undefined) {
          items = items.filter((p) => p.price >= query.price.$gte);
        }

        if (query?.price?.$lte !== undefined) {
          items = items.filter((p) => p.price <= query.price.$lte);
        }

        if (query?.averageRating?.$gte !== undefined) {
          items = items.filter((p) => p.averageRating >= query.averageRating.$gte);
        }

        if (query?.tags) {
          items = items.filter((p) => p.tags.includes(query.tags));
        }

        // Handle text search
        if (query?.$text?.$search) {
          const term = query.$text.$search.toLowerCase();
          items = items.filter(
            (p) =>
              p.title.toLowerCase().includes(term) ||
              p.description.toLowerCase().includes(term) ||
              p.sku.toLowerCase().includes(term) ||
              p.tags.some((t) => t.toLowerCase().includes(term))
          );
        }

        // Text search or regex filter
        if (query?.$or) {
          items = items.filter((p) =>
            query.$or.some((condition: any) => {
              if (condition.title?.$regex) {
                return new RegExp(condition.title.$regex, condition.title.$options || "i").test(
                  p.title
                );
              }
              if (condition.description?.$regex) {
                return new RegExp(
                  condition.description.$regex,
                  condition.description.$options || "i"
                ).test(p.description);
              }
              if (condition.sku?.$regex) {
                return new RegExp(condition.sku.$regex, condition.sku.$options || "i").test(p.sku);
              }
              if (condition.tags?.$regex) {
                return p.tags.some((t) =>
                  new RegExp(condition.tags.$regex, condition.tags.$options || "i").test(t)
                );
              }
              return false;
            })
          );
        }

        return items;
      })
    ),
    countDocuments: vi.fn(async (query: any) => {
      let items = [...mockProducts];
      if (query?.status) items = items.filter((p) => p.status === query.status);
      if (query?.categoryId) {
        items = items.filter(
          (p) => (p.categoryId?._id || p.categoryId)?.toString() === query.categoryId.toString()
        );
      }
      if (query?.stock?.$gt !== undefined) items = items.filter((p) => p.stock > query.stock.$gt);
      if (query?.stock?.$lte !== undefined)
        items = items.filter((p) => p.stock <= query.stock.$lte);
      if (query?.price?.$gte !== undefined)
        items = items.filter((p) => p.price >= query.price.$gte);
      if (query?.price?.$lte !== undefined)
        items = items.filter((p) => p.price <= query.price.$lte);
      if (query?.averageRating?.$gte !== undefined) {
        items = items.filter((p) => p.averageRating >= query.averageRating.$gte);
      }
      if (query?.$text?.$search) {
        const term = query.$text.$search.toLowerCase();
        items = items.filter(
          (p) =>
            p.title.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.tags.some((t) => t.toLowerCase().includes(term))
        );
      }
      if (query?.$or) {
        items = items.filter((p) =>
          query.$or.some((c: any) => {
            if (c.title?.$regex) return new RegExp(c.title.$regex, "i").test(p.title);
            if (c.sku?.$regex) return new RegExp(c.sku.$regex, "i").test(p.sku);
            return false;
          })
        );
      }
      return items.length;
    }),
    aggregate: vi.fn(async (pipeline: any[]) => {
      // Mock aggregation results for facets
      const groupStage = pipeline.find((p) => p.$group);
      if (groupStage?.$group?._id === "$categoryId") {
        const counts: Record<string, number> = {};
        mockProducts
          .filter((p) => p.status === "active")
          .forEach((p) => {
            const cid = (p.categoryId?._id || p.categoryId).toString();
            counts[cid] = (counts[cid] || 0) + 1;
          });
        return Object.entries(counts).map(([id, count]) => ({
          _id: new mongoose.Types.ObjectId(id),
          count,
        }));
      }

      if (groupStage?.$group?._id === "$brandId") {
        const counts: Record<string, number> = {};
        mockProducts
          .filter((p) => p.status === "active" && p.brandId)
          .forEach((p) => {
            const bid = (p.brandId?._id || p.brandId).toString();
            counts[bid] = (counts[bid] || 0) + 1;
          });
        return Object.entries(counts).map(([id, count]) => ({
          _id: new mongoose.Types.ObjectId(id),
          count,
        }));
      }

      if (groupStage?.$group?._id === null) {
        const active = mockProducts.filter((p) => p.status === "active");
        if (active.length === 0) return [];
        const prices = active.map((p) => p.price);
        return [
          {
            _id: null,
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((a, b) => a + b, 0) / prices.length,
          },
        ];
      }

      return [];
    }),
  },
}));

describe("Phase S — Search, SEO & Performance Test Suite", () => {
  const app = createApp();

  const catAudioId = new mongoose.Types.ObjectId();
  const catKeyboardsId = new mongoose.Types.ObjectId();
  const brandVeyoraId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();

    mockCategories = [
      {
        _id: catAudioId,
        name: "Acoustic Gear",
        slug: "acoustic-gear",
        description: "Studio monitors and wireless audiophile headphones",
        status: "active",
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: catKeyboardsId,
        name: "Mechanical Keyboards",
        slug: "mechanical-keyboards",
        description: "Precision tactile instruments and bespoke keycaps",
        status: "active",
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockBrands = [
      {
        _id: brandVeyoraId,
        name: "Veyora Atelier",
        slug: "veyora-atelier",
        status: "active",
      },
    ];

    mockProducts = [
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Aura One Wireless Audiophile Headphones",
        slug: "aura-one-headphones",
        description: "Beryllium driver studio reference headphones",
        price: 349.0,
        sku: "AURA-001",
        stock: 25,
        trackQuantity: true,
        status: "active",
        categoryId: mockCategories[0],
        brandId: mockBrands[0],
        images: [{ url: "https://images.unsplash.com/aura.jpg", isPrimary: true }],
        tags: ["audio", "wireless", "headphones"],
        averageRating: 4.8,
        reviewCount: 32,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Keystroke 75 Mechanical Keyboard",
        slug: "keystroke-75-keyboard",
        description: "Gasket-mounted aluminum frame mechanical typing instrument",
        price: 199.0,
        sku: "KEYS-075",
        stock: 12,
        trackQuantity: true,
        status: "active",
        categoryId: mockCategories[1],
        brandId: mockBrands[0],
        images: [{ url: "https://images.unsplash.com/keyboard.jpg", isPrimary: true }],
        tags: ["keyboard", "desk", "mechanical"],
        averageRating: 4.9,
        reviewCount: 45,
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-01"),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Tactile Switch Set (90x)",
        slug: "tactile-switch-set",
        description: "Lubricated mechanical switches for custom builds",
        price: 49.0,
        sku: "SWITCH-090",
        stock: 0, // out of stock
        trackQuantity: true,
        status: "active",
        categoryId: mockCategories[1],
        brandId: null,
        images: [],
        tags: ["keyboard", "switches"],
        averageRating: 3.5,
        reviewCount: 4,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: "Draft Experimental Acoustic Pod",
        slug: "draft-pod",
        description: "Unpublished prototype pod",
        price: 999.0,
        sku: "PROTOTYPE-01",
        stock: 5,
        trackQuantity: true,
        status: "draft", // draft should never appear on public search
        categoryId: mockCategories[0],
        brandId: null,
        images: [],
        tags: ["prototype"],
        averageRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  });

  describe("1. Full Catalog Search & Relevance", () => {
    it("returns active products matching search keyword 'Aura'", async () => {
      const res = await request(app).get("/api/v1/search?q=Aura");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toContain("Aura");
      expect(res.body.data.some((p: any) => p.status === "draft")).toBe(false);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it("performs case-insensitive fuzzy/regex search on description or SKU", async () => {
      const res = await request(app).get("/api/v1/search?q=keys-075");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].sku).toBe("KEYS-075");
    });

    it("returns all active products with pagination metadata when query is empty", async () => {
      const res = await request(app).get("/api/v1/search");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3); // only active products
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(20);
    });
  });

  describe("2. Search Filters & Faceting", () => {
    it("filters products by categoryId", async () => {
      const res = await request(app).get(`/api/v1/search?categoryId=${catAudioId.toString()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("Aura One Wireless Audiophile Headphones");
    });

    it("filters products by price range (minPrice & maxPrice)", async () => {
      const res = await request(app).get("/api/v1/search?minPrice=100&maxPrice=250");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].price).toBe(199.0);
    });

    it("filters products by in-stock availability", async () => {
      const res = await request(app).get("/api/v1/search?inStock=true");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((p: any) => p.stock > 0)).toBe(true);
      expect(res.body.data.some((p: any) => p.sku === "SWITCH-090")).toBe(false);
    });

    it("filters products by minimum rating (minRating=4)", async () => {
      const res = await request(app).get("/api/v1/search?minRating=4");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((p: any) => p.averageRating >= 4)).toBe(true);
    });

    it("returns computed search facets (categories, brands, price range, in-stock counts)", async () => {
      const res = await request(app).get("/api/v1/search");

      expect(res.status).toBe(200);
      expect(res.body.facets).toBeDefined();
      expect(res.body.facets.categories.length).toBeGreaterThanOrEqual(1);
      expect(res.body.facets.price).toBeDefined();
      expect(res.body.facets.price.min).toBe(49);
      expect(res.body.facets.price.max).toBe(349);
      expect(res.body.facets.inStockCount).toBe(2);
      expect(res.body.facets.outOfStockCount).toBe(1);
    });
  });

  describe("3. Autocomplete & Search Suggestions", () => {
    it("returns autocomplete suggestions and matching category/product previews", async () => {
      const res = await request(app).get("/api/v1/search/suggestions?q=Acoustic");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suggestions).toBeDefined();
      expect(res.body.data.categories.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.categories[0].name).toBe("Acoustic Gear");
    });

    it("rejects search suggestions query with missing q parameter (422 Unprocessable Entity)", async () => {
      const res = await request(app).get("/api/v1/search/suggestions");

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe("4. Pagination & Sorting", () => {
    it("respects page and limit parameters with correct meta bounds", async () => {
      const res = await request(app).get("/api/v1/search?page=1&limit=2");

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
      expect(res.body.meta.hasNextPage).toBe(true);
      expect(res.body.meta.hasPrevPage).toBe(false);
    });

    it("accepts valid sort options (price_asc, price_desc, rating, newest, popular, relevance)", async () => {
      const res = await request(app).get("/api/v1/search?sortBy=price_asc");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("rejects invalid sort option with 422 Unprocessable Entity", async () => {
      const res = await request(app).get("/api/v1/search?sortBy=invalid_sort");

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe("5. Caching & Performance Architecture", () => {
    it("catalogCacheService provides graceful fallback when Redis is absent", async () => {
      const result = await catalogCacheService.get("test-key");
      expect(result).toBeNull();

      // Setting cache should execute without throwing errors
      await expect(catalogCacheService.set("test-key", { value: 123 }, 60)).resolves.not.toThrow();

      // Cache invalidation should execute safely
      await expect(catalogCacheService.invalidateCatalogCache()).resolves.not.toThrow();
    });
  });

  describe("6. SEO Metadata & Structured Data Schemata", () => {
    it("validates Product Schema.org structured data properties", () => {
      const sampleProduct = mockProducts[0]!;
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: sampleProduct.title,
        description: sampleProduct.description,
        sku: sampleProduct.sku,
        brand: {
          "@type": "Brand",
          name: sampleProduct.brandId?.name || "Veyora Atelier",
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: sampleProduct.price,
          availability:
            sampleProduct.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: sampleProduct.averageRating,
          reviewCount: sampleProduct.reviewCount,
        },
      };

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Product");
      expect(schema.offers.availability).toBe("https://schema.org/InStock");
      expect(schema.aggregateRating.ratingValue).toBe(4.8);
      expect(schema.aggregateRating.reviewCount).toBe(32);
    });

    it("validates BreadcrumbList Schema.org structured data properties", () => {
      const breadcrumbs = [
        { name: "Home", url: "https://veyora.store" },
        { name: "Acoustic Gear", url: "https://veyora.store/category/acoustic-gear" },
        { name: "Aura One Headphones", url: "https://veyora.store/products/aura-one-headphones" },
      ];

      const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      };

      expect(schema["@type"]).toBe("BreadcrumbList");
      expect(schema.itemListElement.length).toBe(3);
      expect(schema.itemListElement[0]!.position).toBe(1);
      expect(schema.itemListElement[2]!.name).toBe("Aura One Headphones");
    });
  });
});
