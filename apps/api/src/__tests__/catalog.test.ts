/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import { env } from "../config/env";

// In-memory data storage for integration tests
interface MockCategoryDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  parentId: mongoose.Types.ObjectId | null;
  image: string;
  status: "active" | "inactive";
  order: number;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<MockCategoryDoc>;
}

interface MockBrandDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  logo: string;
  website: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<MockBrandDoc>;
}

interface MockProductDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode: string;
  stock: number;
  trackQuantity: boolean;
  status: "draft" | "active" | "archived";
  categoryId: mongoose.Types.ObjectId;
  brandId?: mongoose.Types.ObjectId | null;
  images: any[];
  variants: any[];
  attributes: any[];
  seo: any;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<MockProductDoc>;
}

let mockCategories: MockCategoryDoc[] = [];
let mockBrands: MockBrandDoc[] = [];
let mockProducts: MockProductDoc[] = [];

function makeCategory(data: Partial<MockCategoryDoc>): MockCategoryDoc {
  return {
    _id: data._id || new mongoose.Types.ObjectId(),
    name: data.name || "Default Category",
    slug: data.slug || "default-category",
    description: data.description || "",
    parentId: data.parentId || null,
    image: data.image || "",
    status: data.status || "active",
    order: data.order ?? 0,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    save: async function () {
      this.updatedAt = new Date();
      return this;
    },
  };
}

function makeBrand(data: Partial<MockBrandDoc>): MockBrandDoc {
  return {
    _id: data._id || new mongoose.Types.ObjectId(),
    name: data.name || "Default Brand",
    slug: data.slug || "default-brand",
    description: data.description || "",
    logo: data.logo || "",
    website: data.website || "",
    status: data.status || "active",
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    save: async function () {
      this.updatedAt = new Date();
      return this;
    },
  };
}

function makeProduct(data: Partial<MockProductDoc>): MockProductDoc {
  return {
    _id: data._id || new mongoose.Types.ObjectId(),
    title: data.title || "Sample Product",
    slug: data.slug || "sample-product",
    description: data.description || "Sample description",
    price: data.price ?? 99.99,
    compareAtPrice: data.compareAtPrice,
    costPrice: data.costPrice,
    sku: data.sku || "PROD-001",
    barcode: data.barcode || "",
    stock: data.stock ?? 50,
    trackQuantity: data.trackQuantity ?? true,
    status: data.status || "active",
    categoryId: data.categoryId || new mongoose.Types.ObjectId(),
    brandId: data.brandId || null,
    images: data.images || [],
    variants: data.variants || [],
    attributes: data.attributes || [],
    seo: data.seo || {},
    tags: data.tags || [],
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    save: async function () {
      this.updatedAt = new Date();
      return this;
    },
  };
}

function mockQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
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
        return items;
      })
    ),
    findOne: vi.fn((query: any) =>
      mockQuery(() => {
        return (
          mockCategories.find((c) => {
            if (query?.slug && c.slug !== query.slug) return false;
            if (query?._id?.$ne && c._id.toString() === query._id.$ne.toString()) return false;
            return true;
          }) || null
        );
      })
    ),
    findById: vi.fn((id: any) =>
      mockQuery(() => {
        const idStr = id?.toString ? id.toString() : String(id);
        return mockCategories.find((c) => c._id.toString() === idStr) || null;
      })
    ),
    create: vi.fn(async (data: any) => {
      const cat = makeCategory(data);
      mockCategories.push(cat);
      return cat;
    }),
    deleteOne: vi.fn(async (query: any) => {
      const idStr = query._id?.toString ? query._id.toString() : String(query._id);
      mockCategories = mockCategories.filter((c) => c._id.toString() !== idStr);
      return { deletedCount: 1 };
    }),
    exists: vi.fn(async (query: any) => {
      if (query?.parentId) {
        const idStr = query.parentId?.toString ? query.parentId.toString() : String(query.parentId);
        return mockCategories.some((c) => c.parentId?.toString() === idStr);
      }
      return false;
    }),
    countDocuments: vi.fn(async (query: any) => {
      if (query?.status) {
        return mockCategories.filter((c) => c.status === query.status).length;
      }
      return mockCategories.length;
    }),
  },
}));

// Mock Brand Model
vi.mock("../modules/catalog/models/brand.model", () => ({
  Brand: {
    find: vi.fn((query: any) =>
      mockQuery(() => {
        let items = [...mockBrands];
        if (query?.status) {
          items = items.filter((b) => b.status === query.status);
        }
        return items;
      })
    ),
    findOne: vi.fn((query: any) =>
      mockQuery(() => {
        return (
          mockBrands.find((b) => {
            if (query?.slug && b.slug !== query.slug) return false;
            if (query?._id?.$ne && b._id.toString() === query._id.$ne.toString()) return false;
            return true;
          }) || null
        );
      })
    ),
    findById: vi.fn((id: any) =>
      mockQuery(() => {
        const idStr = id?.toString ? id.toString() : String(id);
        return mockBrands.find((b) => b._id.toString() === idStr) || null;
      })
    ),
    create: vi.fn(async (data: any) => {
      const brand = makeBrand(data);
      mockBrands.push(brand);
      return brand;
    }),
    deleteOne: vi.fn(async (query: any) => {
      const idStr = query._id?.toString ? query._id.toString() : String(query._id);
      mockBrands = mockBrands.filter((b) => b._id.toString() !== idStr);
      return { deletedCount: 1 };
    }),
    countDocuments: vi.fn(async () => mockBrands.length),
  },
}));

// Mock Product Model
vi.mock("../modules/catalog/models/product.model", () => ({
  Product: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let items = [...mockProducts];
        if (filter?.status) {
          items = items.filter((p) => p.status === filter.status);
        }
        if (filter?.categoryId) {
          const catIdStr = filter.categoryId.toString();
          items = items.filter((p) => p.categoryId.toString() === catIdStr);
        }
        if (filter?.stock?.$gt !== undefined) {
          items = items.filter((p) => p.stock > filter.stock.$gt);
        }
        if (filter?.price?.$gte !== undefined) {
          items = items.filter((p) => p.price >= filter.price.$gte);
        }
        if (filter?.price?.$lte !== undefined) {
          items = items.filter((p) => p.price <= filter.price.$lte);
        }
        if (filter?.$or) {
          const searchStr = (filter.$or[0]?.title?.$regex || "").toLowerCase();
          items = items.filter(
            (p) =>
              p.title.toLowerCase().includes(searchStr) ||
              p.description.toLowerCase().includes(searchStr)
          );
        }
        return items.map((p) => {
          const cat = mockCategories.find((c) => c._id.toString() === p.categoryId.toString());
          const brand = p.brandId
            ? mockBrands.find((b) => b._id.toString() === p.brandId?.toString())
            : null;
          return {
            ...p,
            categoryId: cat || p.categoryId,
            brandId: brand || p.brandId,
          };
        });
      })
    ),
    countDocuments: vi.fn(async (filter: any) => {
      let items = [...mockProducts];
      if (filter?.status) {
        items = items.filter((p) => p.status === filter.status);
      }
      return items.length;
    }),
    findOne: vi.fn((query: any) =>
      mockQuery(() => {
        const found = mockProducts.find((p) => {
          if (query?.slug && p.slug !== query.slug) return false;
          if (query?.sku && p.sku !== query.sku) return false;
          if (query?._id?.$ne && p._id.toString() === query._id.$ne.toString()) return false;
          if (query?.$or) {
            const matchesOr = query.$or.some((clause: any) => {
              if (clause._id && p._id.toString() === clause._id.toString()) return true;
              if (clause.slug && p.slug === clause.slug) return true;
              return false;
            });
            if (!matchesOr) return false;
          }
          return true;
        });
        if (!found) return null;
        const cat = mockCategories.find((c) => c._id.toString() === found.categoryId.toString());
        const brand = found.brandId
          ? mockBrands.find((b) => b._id.toString() === found.brandId?.toString())
          : null;
        return {
          ...found,
          categoryId: cat || found.categoryId,
          brandId: brand || found.brandId,
        };
      })
    ),
    findById: vi.fn((id: any) =>
      mockQuery(() => {
        const idStr = id?.toString ? id.toString() : String(id);
        const found = mockProducts.find((p) => p._id.toString() === idStr);
        if (!found) return null;
        const cat = mockCategories.find((c) => c._id.toString() === found.categoryId.toString());
        const brand = found.brandId
          ? mockBrands.find((b) => b._id.toString() === found.brandId?.toString())
          : null;
        return {
          ...found,
          categoryId: cat || found.categoryId,
          brandId: brand || found.brandId,
        };
      })
    ),
    create: vi.fn(async (data: any) => {
      const prod = makeProduct(data);
      mockProducts.push(prod);
      return prod;
    }),
    deleteOne: vi.fn(async (query: any) => {
      const idStr = query._id?.toString ? query._id.toString() : String(query._id);
      mockProducts = mockProducts.filter((p) => p._id.toString() !== idStr);
      return { deletedCount: 1 };
    }),
    exists: vi.fn(async (query: any) => {
      if (query?.categoryId) {
        const idStr = query.categoryId.toString();
        return mockProducts.some((p) => p.categoryId.toString() === idStr);
      }
      if (query?.brandId) {
        const idStr = query.brandId.toString();
        return mockProducts.some((p) => p.brandId?.toString() === idStr);
      }
      return false;
    }),
  },
}));

// Mock Session model for Auth
const mockSessionId = new mongoose.Types.ObjectId();
vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    findById: vi.fn(async (id: any) => {
      if (id?.toString() === mockSessionId.toString()) {
        return {
          _id: mockSessionId,
          isRevoked: false,
          expiresAt: new Date(Date.now() + 86400000),
        };
      }
      return null;
    }),
  },
}));

function createTestToken(role: "customer" | "admin" | "superadmin" = "admin"): string {
  return jwt.sign(
    {
      sub: new mongoose.Types.ObjectId().toString(),
      email: `${role}@veyora.test`,
      role,
      permissions: role === "superadmin" ? ["*"] : role === "admin" ? ["catalog:manage"] : [],
      sessionId: mockSessionId.toString(),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Catalog Module Integration Tests", () => {
  const app = createApp();
  let adminToken: string;
  let customerToken: string;
  let testCategoryId: string;
  let testBrandId: string;

  beforeEach(() => {
    mockCategories = [];
    mockBrands = [];
    mockProducts = [];

    adminToken = createTestToken("admin");
    customerToken = createTestToken("customer");

    const parentCat = makeCategory({
      name: "Electronics",
      slug: "electronics",
      status: "active",
      order: 1,
    });
    const subCat = makeCategory({
      name: "Smartphones",
      slug: "smartphones",
      parentId: parentCat._id,
      status: "active",
      order: 2,
    });
    mockCategories.push(parentCat, subCat);
    testCategoryId = parentCat._id.toString();

    const brand = makeBrand({
      name: "Apple",
      slug: "apple",
      website: "https://apple.com",
      status: "active",
    });
    mockBrands.push(brand);
    testBrandId = brand._id.toString();

    const prod1 = makeProduct({
      title: "iPhone 15 Pro",
      slug: "iphone-15-pro",
      description: "Titanium design, A17 Pro chip",
      price: 999,
      sku: "IPHONE-15-PRO",
      stock: 25,
      status: "active",
      categoryId: parentCat._id,
      brandId: brand._id,
      tags: ["apple", "smartphone", "flagship"],
    });

    const prod2 = makeProduct({
      title: "Unpublished Concept",
      slug: "unpublished-concept",
      description: "Internal prototype",
      price: 1999,
      sku: "PROTO-001",
      stock: 0,
      status: "draft",
      categoryId: parentCat._id,
    });

    mockProducts.push(prod1, prod2);
  });

  // 1. Categories
  describe("Category Management", () => {
    it("should list active categories publicly", async () => {
      const res = await request(app).get("/api/v1/categories");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("should return category tree with parent-child structure", async () => {
      const res = await request(app).get("/api/v1/categories/tree");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Electronics");
      expect(res.body.data[0].children.length).toBe(1);
      expect(res.body.data[0].children[0].name).toBe("Smartphones");
    });

    it("should block non-admin users from creating categories", async () => {
      const unauth = await request(app).post("/api/v1/admin/categories").send({ name: "Audio" });
      expect(unauth.status).toBe(401);

      const forbidden = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ name: "Audio" });
      expect(forbidden.status).toBe(403);
    });

    it("should allow admin to create a new category", async () => {
      const res = await request(app)
        .post("/api/v1/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Laptops & Computers",
          description: "High-performance notebooks and workstations",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Laptops & Computers");
      expect(res.body.data.slug).toBe("laptops-computers");
    });
  });

  // 2. Brands
  describe("Brand Management", () => {
    it("should list active brands publicly", async () => {
      const res = await request(app).get("/api/v1/brands");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Apple");
    });

    it("should allow admin to create a brand", async () => {
      const res = await request(app)
        .post("/api/v1/admin/brands")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Samsung",
          description: "Electronics and appliances",
          website: "https://samsung.com",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Samsung");
      expect(res.body.data.slug).toBe("samsung");
    });
  });

  // 3. Products
  describe("Product Management & Public Storefront", () => {
    it("should return only active published products to public users", async () => {
      const res = await request(app).get("/api/v1/products");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("iPhone 15 Pro");
    });

    it("should return 404 when public requests a draft product", async () => {
      const res = await request(app).get("/api/v1/products/unpublished-concept");
      expect(res.status).toBe(404);
    });

    it("should allow admin to create product with variants and SKU", async () => {
      const res = await request(app)
        .post("/api/v1/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "MacBook Pro 16",
          description: "M3 Max processor, Liquid Retina XDR",
          price: 2499,
          sku: "MBP-16-M3",
          stock: 10,
          status: "active",
          categoryId: testCategoryId,
          brandId: testBrandId,
          variants: [
            {
              name: "Space Black 512GB",
              sku: "MBP-16-M3-SB-512",
              price: 2499,
              stock: 6,
              attributes: { Color: "Space Black", Storage: "512GB" },
            },
            {
              name: "Silver 1TB",
              sku: "MBP-16-M3-SL-1TB",
              price: 2899,
              stock: 4,
              attributes: { Color: "Silver", Storage: "1TB" },
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("MacBook Pro 16");
      expect(res.body.data.variants.length).toBe(2);
    });

    it("should reject product creation when variant SKU duplicates parent SKU", async () => {
      const res = await request(app)
        .post("/api/v1/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Conflicting Product",
          description: "Invalid variant SKU configuration",
          price: 199,
          sku: "UNIQUE-PARENT-SKU",
          categoryId: testCategoryId,
          variants: [
            {
              name: "Default Variant",
              sku: "UNIQUE-PARENT-SKU", // duplicate with parent
              price: 199,
            },
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain("cannot match parent product SKU");
    });

    it("should reject product creation with duplicate parent SKU", async () => {
      const res = await request(app)
        .post("/api/v1/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Duplicate SKU Phone",
          description: "Uses existing SKU",
          price: 899,
          sku: "IPHONE-15-PRO", // already exists
          categoryId: testCategoryId,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain("already exists");
    });

    it("should return catalog stats for authorized administrators", async () => {
      const res = await request(app)
        .get("/api/v1/admin/catalog/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalProducts).toBe(2);
      expect(res.body.data.activeProducts).toBe(1);
      expect(res.body.data.draftProducts).toBe(1);
    });
  });
});
