/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../app";

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
    it("returns empty personal collection initially", async () => {
      const res = await request(app).get("/api/v1/wishlist").set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.itemCount).toBe(0);
    });
  });

  describe("POST /api/v1/wishlist/items", () => {
    it("successfully adds garment to personal collection", async () => {
      const res = await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: testProduct._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
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
      expect(secondRes.body.data.items).toHaveLength(1);
      expect(secondRes.body.data.itemCount).toBe(1);
    });

    it("rejects non-existent product with 404", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: fakeId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/wishlist/items/:productId", () => {
    it("removes specified garment from personal collection", async () => {
      await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: testProduct._id.toString() });

      const delRes = await request(app)
        .delete(`/api/v1/wishlist/items/${testProduct._id.toString()}`)
        .set(guestHeader);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.items).toHaveLength(0);
      expect(delRes.body.data.itemCount).toBe(0);
    });
  });

  describe("DELETE /api/v1/wishlist", () => {
    it("clears entire personal collection", async () => {
      await request(app)
        .post("/api/v1/wishlist/items")
        .set(guestHeader)
        .send({ productId: testProduct._id.toString() });

      const clearRes = await request(app).delete("/api/v1/wishlist").set(guestHeader);

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.data.items).toHaveLength(0);
      expect(clearRes.body.data.itemCount).toBe(0);
    });
  });
});
