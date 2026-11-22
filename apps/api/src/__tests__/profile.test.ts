/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../app";
import { env } from "../config/env";

const mockCustomerSessionId = new mongoose.Types.ObjectId();
const mockCustomerId = new mongoose.Types.ObjectId();

let mockCurrentUser: any = null;

// Mock Cloudinary SDK
vi.mock("../infrastructure/cloudinary/cloudinary.config", () => ({
  cloudinary: {
    config: vi.fn(),
    utils: {
      api_sign_request: vi.fn(() => "mock_test_cloudinary_signature_xyz123"),
    },
    uploader: {
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
    url: vi.fn(
      (publicId: string) => `https://res.cloudinary.com/veyora-cloud/image/upload/${publicId}`
    ),
  },
}));

// Mock Session Model
vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      if (idStr === mockCustomerSessionId.toString()) {
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

// Mock User Model
vi.mock("../modules/auth/models/user.model", () => {
  const UserMock: any = {
    findById: vi.fn((id: any) => {
      const idStr = id?.toString ? id.toString() : String(id);
      if (mockCurrentUser && mockCurrentUser._id.toString() === idStr) {
        return Promise.resolve(mockCurrentUser);
      }
      return Promise.resolve(null);
    }),
  };
  return { User: UserMock };
});

function createMockToken(userId: string, role: string, sessionId: string) {
  return jwt.sign(
    {
      sub: userId,
      email: `${role}@veyora.com`,
      role,
      permissions: [],
      sessionId,
    },
    env.JWT_ACCESS_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
}

describe("Profile Management System API", () => {
  let app: any;
  let customerToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
    customerToken = createMockToken(
      mockCustomerId.toString(),
      "customer",
      mockCustomerSessionId.toString()
    );

    mockCurrentUser = {
      _id: mockCustomerId,
      email: "customer@veyora.com",
      firstName: "Aarav",
      lastName: "Kapoor",
      displayName: "Aarav K.",
      phone: "+91 9876543210",
      role: "customer",
      permissions: [],
      isEmailVerified: true,
      isActive: true,
      bio: "Fashion enthusiast and connoisseur of artisanal wear.",
      dateOfBirth: new Date("1995-05-15T00:00:00.000Z"),
      gender: "male",
      preferences: {
        language: "en",
        timezone: "Asia/Kolkata",
      },
      avatar: {
        publicId: `veyora/profiles/customers/${mockCustomerId.toString()}/avatar_1700000000`,
        secureUrl: `https://res.cloudinary.com/veyora-cloud/image/upload/v1/veyora/profiles/customers/${mockCustomerId.toString()}/avatar_1700000000.webp`,
        width: 400,
        height: 400,
        format: "webp",
        bytes: 120400,
      },
      lastLoginAt: new Date("2026-11-20T10:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-11-20T10:00:00.000Z"),
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
  });

  describe("GET /api/v1/profile", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/v1/profile");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns authenticated user profile with completion metrics and no password hash", async () => {
      const res = await request(app)
        .get("/api/v1/profile")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockCustomerId.toString());
      expect(res.body.data.email).toBe("customer@veyora.com");
      expect(res.body.data.firstName).toBe("Aarav");
      expect(res.body.data.lastName).toBe("Kapoor");
      expect(res.body.data.displayName).toBe("Aarav K.");
      expect(res.body.data.phone).toBe("+91 9876543210");
      expect(res.body.data.avatar).toBeDefined();
      expect(res.body.data.avatar.publicId).toContain(mockCustomerId.toString());
      expect(res.body.data.profileCompletion).toBeDefined();
      expect(res.body.data.profileCompletion.percentage).toBe(100);
      expect(res.body.data.profileCompletion.isComplete).toBe(true);

      // Verify no sensitive internal fields are exposed
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(res.body.data.refreshToken).toBeUndefined();
      expect(res.body.data.statusReason).toBeUndefined();
    });
  });

  describe("PATCH /api/v1/profile", () => {
    it("updates permitted profile fields and saves to database", async () => {
      const res = await request(app)
        .patch("/api/v1/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          firstName: "Kabir",
          lastName: "Mehta",
          displayName: "Kabir M.",
          bio: "Minimalist fashion designer and collector.",
          gender: "male",
          preferences: {
            language: "hi",
            timezone: "Asia/Kolkata",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe("Kabir");
      expect(res.body.data.lastName).toBe("Mehta");
      expect(res.body.data.displayName).toBe("Kabir M.");
      expect(res.body.data.bio).toBe("Minimalist fashion designer and collector.");
      expect(res.body.data.preferences.language).toBe("hi");
      expect(mockCurrentUser.save).toHaveBeenCalled();
    });

    it("prevents security tampering with role, isActive, or permissions", async () => {
      const res = await request(app)
        .patch("/api/v1/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          firstName: "Hacked",
          role: "superadmin",
          isActive: false,
          isEmailVerified: false,
          permissions: ["manage:system"],
        });

      expect(res.status).toBe(200);
      // Role and sensitive fields remain unmutated customer role
      expect(res.body.data.role).toBe("customer");
      expect(mockCurrentUser.role).toBe("customer");
      expect(mockCurrentUser.isActive).toBe(true);
      expect(mockCurrentUser.isEmailVerified).toBe(true);
    });

    it("rejects invalid input schema with 422 Validation Error", async () => {
      const res = await request(app)
        .patch("/api/v1/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          firstName: "", // empty name
          phone: "invalid_non_numeric_phone_number_format_xyz",
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/profile/avatar/upload-signature", () => {
    it("generates signed upload authorization bounded to the user folder", async () => {
      const res = await request(app)
        .post("/api/v1/profile/avatar/upload-signature")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signature).toBe("mock_test_cloudinary_signature_xyz123");
      expect(res.body.data.apiKey).toBeDefined();
      expect(res.body.data.cloudName).toBeDefined();
      expect(res.body.data.folder).toBe(`veyora/profiles/customers/${mockCustomerId.toString()}`);
      expect(res.body.data.publicId).toContain(
        `veyora/profiles/customers/${mockCustomerId.toString()}/avatar_`
      );
      expect(res.body.data.allowedFormats).toContain("webp");
    });
  });

  describe("PATCH /api/v1/profile/avatar", () => {
    it("attaches verified Cloudinary avatar to user profile", async () => {
      const validPublicId = `veyora/profiles/customers/${mockCustomerId.toString()}/avatar_999999999`;
      const validSecureUrl = `https://res.cloudinary.com/veyora-cloud/image/upload/v1/${validPublicId}.webp`;

      const res = await request(app)
        .patch("/api/v1/profile/avatar")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          publicId: validPublicId,
          secureUrl: validSecureUrl,
          width: 500,
          height: 500,
          format: "webp",
          bytes: 85000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar.publicId).toBe(validPublicId);
      expect(res.body.data.avatar.secureUrl).toBe(validSecureUrl);
      expect(mockCurrentUser.save).toHaveBeenCalled();
    });

    it("rejects attempt to attach asset belonging to another user", async () => {
      const spoofedPublicId = `veyora/profiles/customers/other_victim_user_id/avatar_999999999`;
      const spoofedSecureUrl = `https://res.cloudinary.com/veyora-cloud/image/upload/v1/${spoofedPublicId}.webp`;

      const res = await request(app)
        .patch("/api/v1/profile/avatar")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          publicId: spoofedPublicId,
          secureUrl: spoofedSecureUrl,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid asset ownership");
    });

    it("rejects untrusted non-Cloudinary origin URL", async () => {
      const validPublicId = `veyora/profiles/customers/${mockCustomerId.toString()}/avatar_999999999`;
      const maliciousUrl = `https://malicious-external-site.com/image.png`;

      const res = await request(app)
        .patch("/api/v1/profile/avatar")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          publicId: validPublicId,
          secureUrl: maliciousUrl,
        });

      expect(res.status).toBe(422);
    });
  });

  describe("DELETE /api/v1/profile/avatar", () => {
    it("removes avatar from profile and safely deletes asset from Cloudinary", async () => {
      const res = await request(app)
        .delete("/api/v1/profile/avatar")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar).toBeNull();
      expect(mockCurrentUser.avatar).toBeNull();
      expect(mockCurrentUser.save).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/profile/completion", () => {
    it("returns accurate profile completion breakdown", async () => {
      const res = await request(app)
        .get("/api/v1/profile/completion")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.percentage).toBe(100);
      expect(res.body.data.items).toHaveLength(5);
      expect(res.body.data.completedItems).toContain("Full Name");
      expect(res.body.data.completedItems).toContain("Verified Email");
      expect(res.body.data.completedItems).toContain("Phone Number");
      expect(res.body.data.completedItems).toContain("Profile Photo");
      expect(res.body.data.completedItems).toContain("Personal Bio & Details");
    });

    it("dynamically adjusts percentage when required fields are missing", async () => {
      mockCurrentUser.phone = null;
      mockCurrentUser.avatar = null;

      const res = await request(app)
        .get("/api/v1/profile/completion")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.percentage).toBe(65); // 100 - 20 (phone) - 15 (avatar) = 65%
      expect(res.body.data.isComplete).toBe(false);
      expect(res.body.data.remainingItems).toContain("Phone Number");
      expect(res.body.data.remainingItems).toContain("Profile Photo");
    });
  });
});
