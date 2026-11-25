/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import { env } from "../config/env";

// In-memory data store for tests
interface MockVariant {
  _id: mongoose.Types.ObjectId;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  image?: string;
}

interface MockProduct {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  trackQuantity: boolean;
  status: "active" | "draft" | "archived";
  categoryId: mongoose.Types.ObjectId;
  variants: MockVariant[];
  images: any[];
}

let mockProducts: MockProduct[] = [];
let mockCarts: any[] = [];
let mockInventory: any[] = [];

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

// Mock Inventory
vi.mock("../modules/inventory/models/inventory.model", () => ({
  Inventory: {
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let items = [...mockInventory];
        if (filter?.productId?.$in) {
          const ids = filter.productId.$in.map((id: any) => id.toString());
          items = items.filter((inv) => ids.includes(inv.productId.toString()));
        }
        return items;
      })
    ),
    findOne: vi.fn((filter: any) =>
      mockQuery(() => {
        return (
          mockInventory.find((inv) => {
            if (filter?.productId && inv.productId.toString() !== filter.productId.toString()) {
              return false;
            }
            if (filter?.variantId !== undefined) {
              const vId = filter.variantId ? filter.variantId.toString() : null;
              const invVId = inv.variantId ? inv.variantId.toString() : null;
              if (vId !== invVId) return false;
            }
            return true;
          }) || null
        );
      })
    ),
  },
}));

// Mock Cart
vi.mock("../modules/cart/models/cart.model", () => {
  const MockCartModel: any = function (data: any) {
    const doc: any = {
      _id: data._id || new mongoose.Types.ObjectId(),
      userId: data.userId || null,
      guestId: data.guestId || null,
      items: data.items || [],
      couponCode: data.couponCode || null,
      discountPercent: data.discountPercent || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = mockCarts.findIndex((c) => c._id.toString() === doc._id.toString());
        doc.updatedAt = new Date();
        if (idx > -1) {
          mockCarts[idx] = doc;
        } else {
          mockCarts.push(doc);
        }
        return doc;
      },
    };
    return doc;
  };

  MockCartModel.findOne = vi.fn((filter: any) =>
    mockQuery(() => {
      return (
        mockCarts.find((c) => {
          if (filter?.userId && c.userId && c.userId.toString() === filter.userId.toString()) {
            return true;
          }
          if (filter?.guestId && c.guestId === filter.guestId) {
            return true;
          }
          return false;
        }) || null
      );
    })
  );

  return {
    Cart: MockCartModel,
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

describe("Cart Module Integration & Rigorous Validation", () => {
  let app: any;
  const guestHeader = { "x-guest-id": "test-guest-session-123" };

  let activeProduct: MockProduct;
  let variantProduct: MockProduct;
  let draftProduct: MockProduct;
  let outOfStockProduct: MockProduct;

  beforeEach(() => {
    app = createApp();
    mockProducts = [];
    mockCarts = [];
    mockInventory = [];

    // Active Base Garment with 10 units in stock, price $100
    activeProduct = {
      _id: new mongoose.Types.ObjectId(),
      title: "Pure Mulmul Cotton Kurti",
      slug: "pure-mulmul-cotton-kurti",
      description: "Breathable Jaipur hand-block printed mulmul kurti.",
      price: 100,
      compareAtPrice: 140,
      sku: "VYR-KRT-100",
      stock: 10,
      trackQuantity: true,
      status: "active",
      categoryId: new mongoose.Types.ObjectId(),
      variants: [],
      images: [{ url: "https://example.com/kurti.jpg" }],
    };

    // Product with Variants: Size S (5 in stock, $180), Size M (2 in stock, $190)
    const varS: MockVariant = {
      _id: new mongoose.Types.ObjectId(),
      sku: "VYR-VAR-S",
      size: "S",
      color: "Crimson",
      price: 180,
      stock: 5,
    };
    const varM: MockVariant = {
      _id: new mongoose.Types.ObjectId(),
      sku: "VYR-VAR-M",
      size: "M",
      color: "Crimson",
      price: 190,
      stock: 2,
    };

    variantProduct = {
      _id: new mongoose.Types.ObjectId(),
      title: "Chanderi Silk Anarkali Suit",
      slug: "chanderi-silk-anarkali-suit",
      description: "Regal Chanderi silk flared silhouette with zardozi embroidery.",
      price: 180,
      sku: "VYR-ANK-001",
      stock: 7,
      trackQuantity: true,
      status: "active",
      categoryId: new mongoose.Types.ObjectId(),
      variants: [varS, varM],
      images: [{ url: "https://example.com/anarkali.jpg" }],
    };

    // Draft product (should be rejected)
    draftProduct = {
      _id: new mongoose.Types.ObjectId(),
      title: "Unreleased Designer Lehenga",
      slug: "unreleased-designer-lehenga",
      description: "Pending photoshoot and certification.",
      price: 500,
      sku: "VYR-DFT-001",
      stock: 5,
      trackQuantity: true,
      status: "draft",
      categoryId: new mongoose.Types.ObjectId(),
      variants: [],
      images: [],
    };

    // Out of stock product
    outOfStockProduct = {
      _id: new mongoose.Types.ObjectId(),
      title: "Sold Out Banarasi Brocade Saree",
      slug: "sold-out-banarasi-saree",
      description: "Vintage weave currently out of stock.",
      price: 320,
      sku: "VYR-OOS-001",
      stock: 0,
      trackQuantity: true,
      status: "active",
      categoryId: new mongoose.Types.ObjectId(),
      variants: [],
      images: [],
    };

    mockProducts.push(activeProduct, variantProduct, draftProduct, outOfStockProduct);
  });

  // 1. Cart Retrieval
  describe("GET /api/v1/cart", () => {
    it("returns an empty cart with initialized totals and canonical envelope for new visitor", async () => {
      const res = await request(app).get("/api/v1/cart").set(guestHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("CART_FETCHED");
      expect(res.body.message).toBe("Shopping cart retrieved successfully.");
      expect(res.body.meta.requestId).toBeDefined();
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.totals.subtotal).toBe(0);
      expect(res.body.data.totals.total).toBe(0);
      expect(res.body.data.totals.itemCount).toBe(0);
    });

    it("returns cart for authenticated patron and isolates user cart", async () => {
      const patronId = new mongoose.Types.ObjectId().toString();
      const patronToken = createTestToken(patronId);

      const res = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${patronToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("CART_FETCHED");
      expect(res.body.data.userId).toBe(patronId);
    });

    it("ensures cart isolation between different authenticated patrons", async () => {
      const userAId = new mongoose.Types.ObjectId().toString();
      const userAToken = createTestToken(userAId);

      const userBId = new mongoose.Types.ObjectId().toString();
      const userBToken = createTestToken(userBId);

      // User A adds an item
      await request(app)
        .post("/api/v1/cart/items")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          productId: activeProduct._id.toString(),
          quantity: 2,
        });

      // User B inspects their cart - must be empty
      const userBCart = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${userBToken}`);

      expect(userBCart.status).toBe(200);
      expect(userBCart.body.data.items).toHaveLength(0);
      expect(userBCart.body.data.userId).toBe(userBId);

      // User A inspects their cart - must contain their items
      const userACart = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${userAToken}`);

      expect(userACart.status).toBe(200);
      expect(userACart.body.data.items).toHaveLength(1);
      expect(userACart.body.data.userId).toBe(userAId);
    });
  });

  // 2. Add Item to Cart & Validations
  describe("POST /api/v1/cart/items", () => {
    it("successfully adds an active garment with canonical success envelope", async () => {
      const res = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 2,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("CART_ITEM_ADDED");
      expect(res.body.message).toBe("Garment added to shopping bag.");
      expect(res.body.meta.requestId).toBeDefined();
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].productId).toBe(activeProduct._id.toString());
      expect(res.body.data.items[0].quantity).toBe(2);
      expect(res.body.data.items[0].price).toBe(100);
      expect(res.body.data.totals.subtotal).toBe(200);
      // Subtotal $200 >= $150 -> Free shipping!
      expect(res.body.data.totals.shipping).toBe(0);
    });

    it("rigorously uses server price and ignores spoofed client price", async () => {
      const res = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 1,
        price: 1.0, // Client tries to spoof price to $1
      });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe("CART_ITEM_ADDED");
      // Unit price must be strictly server price ($100)
      expect(res.body.data.items[0].price).toBe(100);
      expect(res.body.data.totals.subtotal).toBe(100);
      // Subtotal $100 < $150 -> $15 shipping fee applies
      expect(res.body.data.totals.shipping).toBe(15);
    });

    it("adds garment with specific variant and resolves variant price", async () => {
      const targetVariant = variantProduct.variants[1]!; // Size M, $190
      const res = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: variantProduct._id.toString(),
        variantId: targetVariant._id.toString(),
        quantity: 1,
      });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe("CART_ITEM_ADDED");
      expect(res.body.data.items[0].variantId).toBe(targetVariant._id.toString());
      expect(res.body.data.items[0].price).toBe(190);
      expect(res.body.data.items[0].size).toBe("M");
    });

    it("rejects non-existent product with 404 and PRODUCT_NOT_FOUND code", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: nonExistentId,
        quantity: 1,
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("PRODUCT_NOT_AVAILABLE");
      expect(res.body.message).toMatch(/product not found/i);
    });

    it("rejects draft/archived product with 404 and PRODUCT_NOT_AVAILABLE code", async () => {
      const res = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: draftProduct._id.toString(),
        quantity: 1,
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("PRODUCT_NOT_AVAILABLE");
    });

    it("rejects invalid variant identifier with 400 and INVALID_PRODUCT_VARIANT code", async () => {
      const res = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: variantProduct._id.toString(),
        variantId: "non-existent-variant-sku",
        quantity: 1,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INVALID_PRODUCT_VARIANT");
      expect(res.body.error.message).toMatch(/variant does not exist/i);
    });

    it("enforces stock limit: rejects quantity exceeding available inventory with 409 and INSUFFICIENT_STOCK", async () => {
      const res = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 99, // Stock is only 10
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INSUFFICIENT_STOCK");
      expect(res.body.error.message).toMatch(/exceeds available stock/i);
    });

    it("rejects adding an out of stock garment with 409 and PRODUCT_OUT_OF_STOCK", async () => {
      const res = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: outOfStockProduct._id.toString(),
        quantity: 1,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("PRODUCT_OUT_OF_STOCK");
      expect(res.body.error.message).toMatch(/out of stock/i);
    });
  });

  // 3. Update Quantity & Removal
  describe("PATCH /api/v1/cart/items/:itemId", () => {
    it("updates item quantity and recalculates server totals with CART_ITEM_UPDATED", async () => {
      // 1. Add item first
      const addRes = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 1,
      });
      const itemId = addRes.body.data.items[0].id;

      // 2. Update to 4 units
      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set(guestHeader)
        .send({ quantity: 4 });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.code).toBe("CART_ITEM_UPDATED");
      expect(patchRes.body.message).toBe("Bag item quantity updated successfully.");
      expect(patchRes.body.data.items[0].quantity).toBe(4);
      expect(patchRes.body.data.totals.subtotal).toBe(400);
      expect(patchRes.body.data.totals.itemCount).toBe(4);
    });

    it("removes item from cart when quantity is updated to 0", async () => {
      const addRes = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 2,
      });
      const itemId = addRes.body.data.items[0].id;

      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set(guestHeader)
        .send({ quantity: 0 });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.code).toBe("CART_ITEM_UPDATED");
      expect(patchRes.body.data.items).toHaveLength(0);
      expect(patchRes.body.data.totals.itemCount).toBe(0);
    });

    it("returns 404 CART_ITEM_NOT_FOUND when updating non-existent item", async () => {
      const res = await request(app)
        .patch("/api/v1/cart/items/non-existent-cart-item")
        .set(guestHeader)
        .send({ quantity: 3 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("CART_ITEM_NOT_FOUND");
    });

    it("rejects negative quantity with validation error and VALIDATION_ERROR code", async () => {
      const res = await request(app)
        .patch("/api/v1/cart/items/some-id")
        .set(guestHeader)
        .send({ quantity: -3 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("rejects updating quantity past available inventory limit with 409 and INSUFFICIENT_STOCK", async () => {
      const addRes = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 2,
      });
      const itemId = addRes.body.data.items[0].id;

      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set(guestHeader)
        .send({ quantity: 15 }); // Stock is 10

      expect(patchRes.status).toBe(409);
      expect(patchRes.body.success).toBe(false);
      expect(patchRes.body.code).toBe("INSUFFICIENT_STOCK");
      expect(patchRes.body.error.message).toMatch(/exceeds available stock/i);
    });
  });

  // 4. Delete Item & Clear Cart
  describe("DELETE /api/v1/cart/items/:itemId and DELETE /api/v1/cart", () => {
    it("removes single item from cart with CART_ITEM_REMOVED", async () => {
      const addRes = await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 1,
      });
      const itemId = addRes.body.data.items[0].id;

      const delRes = await request(app).delete(`/api/v1/cart/items/${itemId}`).set(guestHeader);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.code).toBe("CART_ITEM_REMOVED");
      expect(delRes.body.message).toBe("Garment removed from shopping bag.");
      expect(delRes.body.data.items).toHaveLength(0);
    });

    it("clears entire cart and resets coupon with CART_CLEARED", async () => {
      await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 2,
      });

      const clearRes = await request(app).delete("/api/v1/cart").set(guestHeader);

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.success).toBe(true);
      expect(clearRes.body.code).toBe("CART_CLEARED");
      expect(clearRes.body.message).toBe("Shopping bag cleared successfully.");
      expect(clearRes.body.data.items).toHaveLength(0);
      expect(clearRes.body.data.totals.subtotal).toBe(0);
    });
  });

  // 5. Coupon Application & Totals Calculation
  describe("POST /api/v1/cart/coupon & Totals", () => {
    it("applies valid promo code ATELIER10 and calculates 10% discount with COUPON_APPLIED", async () => {
      // 1. Add item with $100 subtotal
      await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 1,
      });

      // 2. Apply coupon
      const couponRes = await request(app)
        .post("/api/v1/cart/coupon")
        .set(guestHeader)
        .send({ code: "ATELIER10" });

      expect(couponRes.status).toBe(200);
      expect(couponRes.body.success).toBe(true);
      expect(couponRes.body.code).toBe("COUPON_APPLIED");
      expect(couponRes.body.message).toBe("Promotional privilege code applied successfully.");
      expect(couponRes.body.data.couponCode).toBe("ATELIER10");
      expect(couponRes.body.data.discountPercent).toBe(10);
      expect(couponRes.body.data.totals.discount).toBe(10);
      // Discounted subtotal: $90. Shipping fee: $15. Estimated Tax (8% of $90): $7.2. Total: $112.2
      expect(couponRes.body.data.totals.total).toBe(112.2);
    });

    it("rejects invalid coupon with 400 and COUPON_INVALID", async () => {
      const res = await request(app)
        .post("/api/v1/cart/coupon")
        .set(guestHeader)
        .send({ code: "INVALID_CODE_99" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("COUPON_INVALID");
      expect(res.body.error.message).toMatch(/invalid or expired/i);
    });

    it("removes coupon and resets discount with COUPON_REMOVED", async () => {
      await request(app).post("/api/v1/cart/items").set(guestHeader).send({
        productId: activeProduct._id.toString(),
        quantity: 1,
      });
      await request(app).post("/api/v1/cart/coupon").set(guestHeader).send({ code: "ATELIER10" });

      const removeRes = await request(app).delete("/api/v1/cart/coupon").set(guestHeader);
      expect(removeRes.status).toBe(200);
      expect(removeRes.body.success).toBe(true);
      expect(removeRes.body.code).toBe("COUPON_REMOVED");
      expect(removeRes.body.message).toBe("Coupon removed successfully.");
      expect(removeRes.body.data.couponCode).toBeUndefined();
      expect(removeRes.body.data.totals.discount).toBe(0);
    });
  });

  // 6. Bulk Cart Sync & Merge
  describe("POST /api/v1/cart/sync", () => {
    it("bulk synchronizes client items with server database and clamps quantity", async () => {
      const targetVariant = variantProduct.variants[0]!; // Size S, stock 5, $180

      const syncRes = await request(app)
        .post("/api/v1/cart/sync")
        .set(guestHeader)
        .send({
          items: [
            {
              productId: activeProduct._id.toString(),
              quantity: 3,
            },
            {
              productId: variantProduct._id.toString(),
              variantId: targetVariant._id.toString(),
              quantity: 99, // Should clamp to available stock (5)
            },
          ],
        });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.success).toBe(true);
      expect(syncRes.body.code).toBe("CART_SYNCED");
      expect(syncRes.body.message).toBe("Shopping bag synchronized successfully.");
      expect(syncRes.body.data.items).toHaveLength(2);

      // Verify clamped quantity
      const varItem = syncRes.body.data.items.find(
        (i: any) => i.productId === variantProduct._id.toString()
      );
      expect(varItem.quantity).toBe(5);

      // Verify server subtotal: 3 * $100 + 5 * $180 = $300 + $900 = $1200
      expect(syncRes.body.data.totals.subtotal).toBe(1200);
    });
  });
});
