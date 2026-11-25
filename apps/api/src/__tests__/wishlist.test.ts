/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import { env } from "../config/env";

let mockProducts: any[] = [];
let mockWishlists: any[] = [];
let mockCategories: any[] = [];

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

// Mock Product
vi.mock("../modules/catalog/models/product.model", () => ({
  Product: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let items = [...mockProducts];
        if (filter?._id?.$in) {
          const ids = filter._id.$in.map((id: any) => id.toString());
          items = items.filter((p) => ids.includes(p._id.toString()));
        }
        return items;
      })
    ),
    findById: vi.fn((id: any) =>
      mockQuery(() => {
        const idStr = id?.toString ? id.toString() : String(id);
        return mockProducts.find((p) => p._id.toString() === idStr) || null;
      })
    ),
  },
}));

// Mock Category
vi.mock("../modules/catalog/models/category.model", () => ({
  Category: {
    find: vi.fn(() =>
      mockQuery(() => {
        return [...mockCategories];
      })
    ),
  },
}));

// Mock Wishlist
vi.mock("../modules/wishlist/models/wishlist.model", () => {
  const MockWishlistModel: any = function (data: any) {
    const doc: any = {
      _id: data._id || new mongoose.Types.ObjectId(),
      userId: data.userId || null,
      guestId: data.guestId || null,
      items: data.items || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = mockWishlists.findIndex((w) => w._id.toString() === doc._id.toString());
        doc.updatedAt = new Date();
        if (idx > -1) {
          mockWishlists[idx] = doc;
        } else {
          mockWishlists.push(doc);
        }
        return doc;
      },
    };
    return doc;
  };

  MockWishlistModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return (
        mockWishlists.find((w) => {
          if (filter?.userId && w.userId && w.userId.toString() === filter.userId.toString()) {
            return true;
          }
          if (filter?.guestId && w.guestId === filter.guestId) {
            return true;
          }
          return false;
        }) || null
      );
    })
  );

  return {
    Wishlist: MockWishlistModel,
  };
});

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

function createTestToken(userId: string = new mongoose.Types.ObjectId().toString()): string {
  return jwt.sign(
    {
      sub: userId,
      email: "patron@veyora.test",
      role: "customer",
      permissions: [],
      sessionId: mockSessionId.toString(),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Wishlist Module Integration & Persistence", () => {
  let app: any;
  const guestHeader = { "x-guest-id": "wishlist-guest-session-456" };

  let testProduct: any;

  beforeEach(() => {
    app = createApp();
    mockProducts = [];
    mockWishlists = [];
    mockCategories = [];

    const categoryId = new mongoose.Types.ObjectId();
    mockCategories.push({
      _id: categoryId,
      name: "Sarees & Drapes",
    });

    testProduct = {
      _id: new mongoose.Types.ObjectId(),
      title: "Banarasi Katan Silk Brocade Saree",
      slug: "banarasi-katan-silk-saree",
      price: 450,
      compareAtPrice: 550,
      stock: 5,
      status: "active",
      categoryId,
      images: [{ url: "https://example.com/saree.jpg" }],
    };

    mockProducts.push(testProduct);
  });

  describe("GET /api/v1/wishlist", () => {
    it("returns empty personal collection initially with canonical envelope", async () => {
      const res = await request(app).get("/api/v1/wishlist").set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("WISHLIST_FETCHED");
      expect(res.body.message).toBe("Wishlist retrieved successfully.");
      expect(res.body.meta.requestId).toBeDefined();
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.itemCount).toBe(0);
    });

    it("retrieves personal collection for authenticated patron and isolates user wishlist", async () => {
      const patronId = new mongoose.Types.ObjectId().toString();
      const patronToken = createTestToken(patronId);

      const res = await request(app)
        .get("/api/v1/wishlist")
        .set("Authorization", `Bearer ${patronToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("WISHLIST_FETCHED");
      expect(res.body.data.userId).toBe(patronId);
    });

    it("ensures wishlist isolation between different authenticated patrons", async () => {
      const userAId = new mongoose.Types.ObjectId().toString();
      const userAToken = createTestToken(userAId);

      const userBId = new mongoose.Types.ObjectId().toString();
      const userBToken = createTestToken(userBId);

      // User A adds product
      await request(app)
        .post("/api/v1/wishlist/items")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ productId: testProduct._id.toString() });

      // User B inspects wishlist - must be empty
      const userBWishlist = await request(app)
        .get("/api/v1/wishlist")
        .set("Authorization", `Bearer ${userBToken}`);

      expect(userBWishlist.status).toBe(200);
      expect(userBWishlist.body.data.items).toHaveLength(0);
      expect(userBWishlist.body.data.userId).toBe(userBId);

      // User A inspects wishlist - must contain item
      const userAWishlist = await request(app)
        .get("/api/v1/wishlist")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(userAWishlist.status).toBe(200);
      expect(userAWishlist.body.data.items).toHaveLength(1);
      expect(userAWishlist.body.data.userId).toBe(userAId);
    });
  });

  describe("POST /api/v1/wishlist/items", () => {
    it("successfully adds garment to personal collection with canonical envelope", async () => {
      const res = await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: testProduct._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("WISHLIST_ITEM_ADDED");
      expect(res.body.message).toBe("Garment saved to personal collection.");
      expect(res.body.meta.requestId).toBeDefined();
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].productId).toBe(testProduct._id.toString());
      expect(res.body.data.items[0].title).toBe("Banarasi Katan Silk Brocade Saree");
      expect(res.body.data.items[0].category).toBe("Sarees & Drapes");
      expect(res.body.data.itemCount).toBe(1);
    });

    it("handles duplicate addition idempotently", async () => {
      await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: testProduct._id.toString() });

      const secondRes = await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: testProduct._id.toString() });

      expect(secondRes.status).toBe(201);
      expect(secondRes.body.code).toBe("WISHLIST_ITEM_ADDED");
      expect(secondRes.body.data.items).toHaveLength(1);
      expect(secondRes.body.data.itemCount).toBe(1);
    });

    it("rejects non-existent product with 404 and PRODUCT_NOT_AVAILABLE", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: fakeId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("PRODUCT_NOT_AVAILABLE");
      expect(res.body.error.message).toMatch(/product not found/i);
    });

    it("rejects draft or inactive product with 404 and PRODUCT_NOT_AVAILABLE", async () => {
      const draftProduct = {
        _id: new mongoose.Types.ObjectId(),
        title: "Draft Garment",
        slug: "draft-garment",
        price: 200,
        status: "draft",
        stock: 5,
        images: [],
      };
      mockProducts.push(draftProduct);

      const res = await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: draftProduct._id.toString() });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("PRODUCT_NOT_AVAILABLE");
    });
  });

  describe("DELETE /api/v1/wishlist/items/:productId", () => {
    it("removes specified garment from personal collection with WISHLIST_ITEM_REMOVED", async () => {
      await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: testProduct._id.toString() });

      const delRes = await request(app)
        .delete(`/api/v1/wishlist/items/${testProduct._id.toString()}`)
        .set(guestHeader);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.code).toBe("WISHLIST_ITEM_REMOVED");
      expect(delRes.body.message).toBe("Garment removed from personal collection.");
      expect(delRes.body.data.items).toHaveLength(0);
      expect(delRes.body.data.itemCount).toBe(0);
    });
  });

  describe("DELETE /api/v1/wishlist", () => {
    it("clears entire personal collection with WISHLIST_CLEARED", async () => {
      await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: testProduct._id.toString() });

      const clearRes = await request(app).delete("/api/v1/wishlist").set(guestHeader);

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.success).toBe(true);
      expect(clearRes.body.code).toBe("WISHLIST_CLEARED");
      expect(clearRes.body.message).toBe("Personal collection cleared successfully.");
      expect(clearRes.body.data.items).toHaveLength(0);
      expect(clearRes.body.data.itemCount).toBe(0);
    });
  });
});
