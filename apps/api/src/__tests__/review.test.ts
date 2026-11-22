/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";

let mockReviews: any[] = [];
let mockProducts: any[] = [];
let mockUsers: any[] = [];
let mockOrders: any[] = [];

const mockAdminSessionId = new mongoose.Types.ObjectId();
const mockCustomerSessionId = new mongoose.Types.ObjectId();
const mockCustomer2SessionId = new mongoose.Types.ObjectId();

function mockQuery<T>(execFn: () => Promise<T> | T) {
  const queryObj: any = {
    populate: vi.fn(() => queryObj),
    sort: vi.fn(() => queryObj),
    skip: vi.fn(() => queryObj),
    limit: vi.fn(() => queryObj),
    lean: vi.fn(() => queryObj),
    select: vi.fn(() => queryObj),
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

// 1. Mock Session Model
vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      if (
        idStr === mockAdminSessionId.toString() ||
        idStr === mockCustomerSessionId.toString() ||
        idStr === mockCustomer2SessionId.toString()
      ) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(idStr),
          isRevoked: false,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        });
      }
      return Promise.resolve(null);
    }),
  },
}));

// 2. Mock User Model
vi.mock("../modules/auth/models/user.model", () => ({
  User: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      const user = mockUsers.find((u) => u._id.toString() === idStr);
      return mockQuery(() => (user ? { ...user } : null));
    }),
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let results = [...mockUsers];
        if (filter.$or) {
          results = results.filter((u) =>
            filter.$or.some((clause: any) => {
              if (clause.firstName && clause.firstName.test(u.firstName)) return true;
              if (clause.lastName && clause.lastName.test(u.lastName)) return true;
              if (clause.email && clause.email.test(u.email)) return true;
              return false;
            })
          );
        }
        return results;
      })
    ),
  },
}));

// 3. Mock Product Model
vi.mock("../modules/catalog/models/product.model", () => ({
  Product: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      const product = mockProducts.find((p) => p._id.toString() === idStr);
      return mockQuery(() => (product ? { ...product } : null));
    }),
    findOne: vi.fn((filter: any) => {
      let results = [...mockProducts];
      if (filter._id) {
        results = results.filter((p) => p._id.toString() === filter._id.toString());
      }
      if (filter.status && filter.status.$ne) {
        results = results.filter((p) => p.status !== filter.status.$ne);
      }
      return Promise.resolve(results[0] ? { ...results[0] } : null);
    }),
    find: vi.fn((filter: any) =>
      mockQuery(() => {
        let results = [...mockProducts];
        if (filter.title) {
          results = results.filter((p) => filter.title.test(p.title));
        }
        return results;
      })
    ),
    findByIdAndUpdate: vi.fn((id: any, update: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      const product = mockProducts.find((p) => p._id.toString() === idStr);
      if (product) {
        if (update.averageRating !== undefined) product.averageRating = update.averageRating;
        if (update.reviewCount !== undefined) product.reviewCount = update.reviewCount;
      }
      return Promise.resolve(product);
    }),
  },
}));

// 4. Mock Order Model
vi.mock("../modules/checkout/models/order.model", () => ({
  Order: {
    findOne: vi.fn((filter: any) => {
      let results = [...mockOrders];
      if (filter.customerId) {
        results = results.filter((o) => o.customerId.toString() === filter.customerId.toString());
      }
      if (filter["items.productId"]) {
        results = results.filter((o) =>
          o.items && o.items.some((item: any) => item.productId.toString() === filter["items.productId"].toString())
        );
      }
      if (filter.status && filter.status.$in) {
        results = results.filter((o) => filter.status.$in.includes(o.status));
      }
      return Promise.resolve(results[0] || null);
    }),
  },
}));

// 5. Mock Review Model
vi.mock("../modules/review/models/review.model", () => {
  const MockReviewModel: any = vi.fn((data: any) => {
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      ...data,
      helpfulCount: data.helpfulCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn(function (this: any) {
        const idx = mockReviews.findIndex((r) => r._id.toString() === this._id.toString());
        if (idx >= 0) {
          mockReviews[idx] = this;
        } else {
          mockReviews.push(this);
        }
        return Promise.resolve(this);
      }),
    };
    return doc;
  });

  MockReviewModel.create = vi.fn((data: any) => {
    const doc = MockReviewModel(data);
    mockReviews.push(doc);
    return Promise.resolve(doc);
  });

  MockReviewModel.findOne = vi.fn((filter: any) => {
    let results = [...mockReviews];
    if (filter.productId) {
      results = results.filter((r) => r.productId.toString() === filter.productId.toString());
    }
    if (filter.userId) {
      results = results.filter((r) => r.userId.toString() === filter.userId.toString());
    }
    return Promise.resolve(results[0] ? { ...results[0] } : null);
  });

  MockReviewModel.findById = vi.fn((id: any) => {
    const idStr = id?.toString ? id.toString() : String(id);
    const review = mockReviews.find((r) => r._id.toString() === idStr);
    if (!review) return mockQuery(() => null);

    const doc = {
      ...review,
      save: vi.fn(function (this: any) {
        const idx = mockReviews.findIndex((r) => r._id.toString() === this._id.toString());
        if (idx >= 0) {
          mockReviews[idx] = { ...this };
        }
        return Promise.resolve(this);
      }),
    };
    return mockQuery(() => doc);
  });

  MockReviewModel.find = vi.fn((filter: any) =>
    mockQuery(() => {
      let results = [...mockReviews];
      if (filter.productId) {
        results = results.filter((r) => r.productId.toString() === filter.productId.toString());
      }
      if (filter.status) {
        results = results.filter((r) => r.status === filter.status);
      }
      if (filter.rating) {
        results = results.filter((r) => r.rating === filter.rating);
      }
      if (filter.userId) {
        results = results.filter((r) => r.userId.toString() === filter.userId.toString());
      }
      return results.map((r) => {
        const user = mockUsers.find((u) => u._id.toString() === r.userId.toString());
        const product = mockProducts.find((p) => p._id.toString() === r.productId.toString());
        return {
          ...r,
          userId: user || { _id: r.userId, firstName: "Verified", lastName: "Buyer", email: "user@veyora.com" },
          productId: product || { _id: r.productId, title: "Test Garment", slug: "test-garment" },
        };
      });
    })
  );

  MockReviewModel.countDocuments = vi.fn((filter: any) => {
    let results = [...mockReviews];
    if (filter.productId) {
      results = results.filter((r) => r.productId.toString() === filter.productId.toString());
    }
    if (filter.status) {
      results = results.filter((r) => r.status === filter.status);
    }
    if (filter.rating) {
      results = results.filter((r) => r.rating === filter.rating);
    }
    if (filter.userId) {
      results = results.filter((r) => r.userId.toString() === filter.userId.toString());
    }
    return Promise.resolve(results.length);
  });

  MockReviewModel.aggregate = vi.fn((pipeline: any[]) => {
    let results = [...mockReviews];
    const matchStage = pipeline.find((p) => p.$match);
    if (matchStage) {
      if (matchStage.$match.productId) {
        results = results.filter((r) => r.productId.toString() === matchStage.$match.productId.toString());
      }
      if (matchStage.$match.status) {
        results = results.filter((r) => r.status === matchStage.$match.status);
      }
    }

    const groupStage = pipeline.find((p) => p.$group);
    if (groupStage) {
      if (groupStage.$group._id === "$rating") {
        const counts: Record<number, number> = {};
        results.forEach((r) => {
          counts[r.rating] = (counts[r.rating] || 0) + 1;
        });
        return Promise.resolve(
          Object.entries(counts).map(([rating, count]) => ({
            _id: Number(rating),
            count,
          }))
        );
      }
      if (groupStage.$group._id === "$status") {
        const groups: Record<string, { count: number; sumRating: number }> = {};
        results.forEach((r) => {
          if (!groups[r.status]) groups[r.status] = { count: 0, sumRating: 0 };
          const entry = groups[r.status]!;
          entry.count++;
          entry.sumRating += r.rating;
        });
        return Promise.resolve(
          Object.entries(groups).map(([status, g]) => ({
            _id: status,
            count: g.count,
            avgRating: g.sumRating / g.count,
          }))
        );
      }
      if (groupStage.$group._id === "$productId") {
        if (results.length === 0) return Promise.resolve([]);
        const total = results.length;
        const sum = results.reduce((acc, r) => acc + r.rating, 0);
        return Promise.resolve([
          {
            _id: matchStage?.$match?.productId,
            averageRating: sum / total,
            reviewCount: total,
          },
        ]);
      }
    }
    return Promise.resolve([]);
  });

  MockReviewModel.findByIdAndUpdate = vi.fn((id: any, update: any) => {
    const idStr = id?.toString ? id.toString() : String(id);
    const review = mockReviews.find((r) => r._id.toString() === idStr);
    if (review) {
      if (update.$inc && update.$inc.helpfulCount) {
        review.helpfulCount = (review.helpfulCount || 0) + update.$inc.helpfulCount;
      }
    }
    return Promise.resolve(review || null);
  });

  MockReviewModel.deleteOne = vi.fn((filter: any) => {
    if (filter._id) {
      const idStr = filter._id.toString();
      mockReviews = mockReviews.filter((r) => r._id.toString() !== idStr);
    }
    return Promise.resolve({ acknowledged: true, deletedCount: 1 });
  });

  return { Review: MockReviewModel };
});

const app = createApp();

describe("Phase N — Veyora Product Reviews Integration Tests", () => {
  let adminToken: string;
  let customerToken: string;
  let customer2Token: string;
  let adminId: mongoose.Types.ObjectId;
  let customerId: mongoose.Types.ObjectId;
  let customer2Id: mongoose.Types.ObjectId;
  let productId1: mongoose.Types.ObjectId;
  let productId2: mongoose.Types.ObjectId;

  beforeEach(() => {
    mockReviews = [];
    mockProducts = [];
    mockUsers = [];
    mockOrders = [];

    adminId = new mongoose.Types.ObjectId();
    customerId = new mongoose.Types.ObjectId();
    customer2Id = new mongoose.Types.ObjectId();
    productId1 = new mongoose.Types.ObjectId();
    productId2 = new mongoose.Types.ObjectId();

    // Seed Admin User
    mockUsers.push({
      _id: adminId,
      firstName: "Admin",
      lastName: "Curator",
      email: "admin@veyora.com",
      role: "admin",
      permissions: ["read:system", "manage:catalog"],
      isActive: true,
      isEmailVerified: true,
    });

    // Seed Customer 1
    mockUsers.push({
      _id: customerId,
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya.sharma@example.com",
      role: "customer",
      permissions: [],
      isActive: true,
      isEmailVerified: true,
    });

    // Seed Customer 2
    mockUsers.push({
      _id: customer2Id,
      firstName: "Rohan",
      lastName: "Mehta",
      email: "rohan.mehta@example.com",
      role: "customer",
      permissions: [],
      isActive: true,
      isEmailVerified: true,
    });

    // Seed Product 1
    mockProducts.push({
      _id: productId1,
      title: "Chanderi Silk Handcrafted Kurti",
      slug: "chanderi-silk-kurti",
      price: 4999,
      status: "active",
      averageRating: 0,
      reviewCount: 0,
      images: [{ url: "https://example.com/kurti.jpg", isPrimary: true }],
    });

    // Seed Product 2
    mockProducts.push({
      _id: productId2,
      title: "Pure Banarasi Brocade Sherwani",
      slug: "banarasi-brocade-sherwani",
      price: 18999,
      status: "active",
      averageRating: 0,
      reviewCount: 0,
      images: [{ url: "https://example.com/sherwani.jpg", isPrimary: true }],
    });

    // Seed Verified Purchase Order for Customer 1 on Product 1
    mockOrders.push({
      _id: new mongoose.Types.ObjectId(),
      customerId: customerId,
      status: "delivered",
      items: [
        {
          productId: productId1,
          title: "Chanderi Silk Handcrafted Kurti",
          price: 4999,
          quantity: 1,
        },
      ],
    });

    // Generate valid tokens
    const secret = "veyora_jwt_access_secret_super_secure_32chars_min";
    adminToken = jwt.sign(
      {
        sub: adminId.toString(),
        email: "admin@veyora.com",
        role: "admin",
        permissions: ["read:system", "manage:catalog"],
        sessionId: mockAdminSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    customerToken = jwt.sign(
      {
        sub: customerId.toString(),
        email: "priya.sharma@example.com",
        role: "customer",
        permissions: [],
        sessionId: mockCustomerSessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );

    customer2Token = jwt.sign(
      {
        sub: customer2Id.toString(),
        email: "rohan.mehta@example.com",
        role: "customer",
        permissions: [],
        sessionId: mockCustomer2SessionId.toString(),
      },
      secret,
      { expiresIn: "1h" }
    );
  });

  // ==========================================
  // 1. Review Submission
  // ==========================================
  describe("Review Submission (POST /api/v1/products/:productId/reviews)", () => {
    it("should allow an authenticated customer to submit a review for an active garment", async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId1}/reviews`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 5,
          title: "Exquisite hand-block artisanal craftsmanship",
          comment: "The Chanderi silk fabric is luxuriously soft with breathtaking zari borders.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.title).toBe("Exquisite hand-block artisanal craftsmanship");
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.isVerifiedPurchase).toBe(true); // Customer has a delivered order
    });

    it("should flag a review as unverified when customer has not purchased the garment", async () => {
      // Customer 2 did not purchase Product 1
      const res = await request(app)
        .post(`/api/v1/products/${productId1}/reviews`)
        .set("Authorization", `Bearer ${customer2Token}`)
        .send({
          rating: 4,
          title: "Visually stunning drape",
          comment: "Observed this collection at the runway. Beautiful color palette.",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isVerifiedPurchase).toBe(false);
      expect(res.body.data.status).toBe("pending");
    });

    it("should reject duplicate reviews on the same product from the same customer with 409 Conflict", async () => {
      // First review
      await request(app)
        .post(`/api/v1/products/${productId1}/reviews`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 5,
          title: "First impression review",
          comment: "Delighted with the rapid delivery and delicate silk packaging.",
        });

      // Second review by same customer on same product
      const res = await request(app)
        .post(`/api/v1/products/${productId1}/reviews`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 4,
          title: "Duplicate review attempt",
          comment: "Trying to submit another review on the same garment.",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
      expect(res.body.message).toMatch(/already submitted a review/i);
    });

    it("should reject review submission for non-existent garment with 404 Not Found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/products/${fakeId}/reviews`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 5,
          title: "Ghost item feedback",
          comment: "Item does not exist in the atelier database.",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should reject review submission with invalid rating (< 1 or > 5) with 422 Unprocessable Entity", async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId1}/reviews`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          rating: 6,
          title: "Invalid rating value",
          comment: "Rating of 6 stars should fail validation.",
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject review submission from unauthenticated visitor with 401 Unauthorized", async () => {
      const res = await request(app)
        .post(`/api/v1/products/${productId1}/reviews`)
        .send({
          rating: 5,
          title: "Unauthenticated review",
          comment: "Visitor trying to submit without bearer token.",
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });

  // ==========================================
  // 2. Storefront Review Display & Summaries
  // ==========================================
  describe("Storefront Review Display (GET /api/v1/products/:productId/reviews)", () => {
    beforeEach(() => {
      // Seed an approved review and a pending review
      mockReviews.push({
        _id: new mongoose.Types.ObjectId(),
        productId: productId1,
        userId: customerId,
        rating: 5,
        title: "Regal wedding attire",
        comment: "Wore this to a festive gala. The fabric and drape are peerless.",
        status: "approved",
        isVerifiedPurchase: true,
        helpfulCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockReviews.push({
        _id: new mongoose.Types.ObjectId(),
        productId: productId1,
        userId: customer2Id,
        rating: 3,
        title: "Awaiting moderation review",
        comment: "This review should not be visible publicly until approved.",
        status: "pending",
        isVerifiedPurchase: false,
        helpfulCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should only display approved reviews on the storefront, omitting pending/rejected", async () => {
      const res = await request(app)
        .get(`/api/v1/products/${productId1}/reviews`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toHaveLength(1);
      expect(res.body.data.reviews[0].title).toBe("Regal wedding attire");
      expect(res.body.data.reviews[0].status).toBe("approved");
    });

    it("should return the product rating summary with star breakdown", async () => {
      const res = await request(app)
        .get(`/api/v1/products/${productId1}/reviews/summary`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.averageRating).toBe(5);
      expect(res.body.data.reviewCount).toBe(1);
      expect(res.body.data.breakdown[5]).toBe(1);
    });

    it("should increment helpful counter on POST /api/v1/reviews/:id/helpful", async () => {
      const reviewId = mockReviews[0]._id;
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/helpful`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.helpfulCount).toBe(4);
    });
  });

  // ==========================================
  // 3. Admin Moderation & RBAC
  // ==========================================
  describe("Admin Review Moderation (/api/v1/admin/reviews)", () => {
    let pendingReviewId: mongoose.Types.ObjectId;

    beforeEach(() => {
      pendingReviewId = new mongoose.Types.ObjectId();
      mockReviews.push({
        _id: pendingReviewId,
        productId: productId1,
        userId: customerId,
        rating: 4,
        title: "Quality test for moderation",
        comment: "Soft fabric, timely shipping, overall a delightful experience.",
        status: "pending",
        isVerifiedPurchase: true,
        helpfulCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should allow admin to list all reviews with statistics", async () => {
      const res = await request(app)
        .get("/api/v1/admin/reviews")
        .set("Authorization", `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toBeDefined();
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.pendingCount).toBe(1);
    });

    it("should allow admin to approve a review, triggering product rating updates", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reviews/${pendingReviewId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("approved");

      // Verify product cache updated
      const product = mockProducts.find((p) => p._id.toString() === productId1.toString());
      expect(product.reviewCount).toBe(1);
      expect(product.averageRating).toBe(4);
    });

    it("should allow admin to reject a review with a reason", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reviews/${pendingReviewId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "rejected",
          rejectionReason: "Contains external promotional links contrary to policy",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("rejected");
      expect(res.body.data.rejectionReason).toBe(
        "Contains external promotional links contrary to policy"
      );
    });

    it("should allow admin to permanently delete a review", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/reviews/${pendingReviewId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockReviews.some((r) => r._id.toString() === pendingReviewId.toString())).toBe(false);
    });

    it("should reject customer access to admin review moderation with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reviews/${pendingReviewId}/status`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });

  // ==========================================
  // 4. Customer Review History
  // ==========================================
  describe("Customer Review History (GET /api/v1/reviews/my-reviews)", () => {
    it("should return the authenticated customer's submitted reviews", async () => {
      mockReviews.push({
        _id: new mongoose.Types.ObjectId(),
        productId: productId1,
        userId: customerId,
        rating: 5,
        title: "My custom review",
        comment: "Loving this attire from Veyora.",
        status: "pending",
        isVerifiedPurchase: true,
        helpfulCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/v1/reviews/my-reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toHaveLength(1);
      expect(res.body.data.reviews[0].title).toBe("My custom review");
    });
  });
});
