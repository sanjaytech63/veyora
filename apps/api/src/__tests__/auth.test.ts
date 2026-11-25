import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../app";
import { IUser } from "../modules/auth/models/user.model";
import { passwordService } from "../modules/auth/services/password.service";
import { tokenService } from "../modules/auth/services/token.service";
import { otpService } from "../modules/auth/services/otp.service";

// In-memory data storage for integration tests
interface MockUserDoc {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin" | "superadmin";
  permissions: string[];
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<MockUserDoc>;
}

interface MockSessionDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  familyId: string;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<MockSessionDoc>;
}

interface MockOtpDoc {
  _id: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<MockOtpDoc>;
}

const mockUsers: MockUserDoc[] = [];
const mockSessions: MockSessionDoc[] = [];
const mockOtps: MockOtpDoc[] = [];

function makeUserDoc(data: Partial<MockUserDoc>): MockUserDoc {
  const doc: MockUserDoc = {
    _id: data._id || new mongoose.Types.ObjectId(),
    email: data.email || "",
    passwordHash: data.passwordHash || "",
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    role: data.role || "customer",
    permissions: data.permissions || [],
    isEmailVerified: Boolean(data.isEmailVerified),
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    save: async function () {
      this.updatedAt = new Date();
      return this;
    },
  };
  return doc;
}

function makeSessionDoc(data: Partial<MockSessionDoc>): MockSessionDoc {
  const doc: MockSessionDoc = {
    _id: data._id || new mongoose.Types.ObjectId(),
    userId: data.userId || new mongoose.Types.ObjectId(),
    refreshTokenHash: data.refreshTokenHash || "",
    familyId: data.familyId || "",
    userAgent: data.userAgent || "",
    ipAddress: data.ipAddress || "",
    isRevoked: Boolean(data.isRevoked),
    expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    save: async function () {
      this.updatedAt = new Date();
      return this;
    },
  };
  return doc;
}

function makeOtpDoc(data: Partial<MockOtpDoc>): MockOtpDoc {
  const doc: MockOtpDoc = {
    _id: data._id || new mongoose.Types.ObjectId(),
    email: data.email || "",
    otpHash: data.otpHash || "",
    type: data.type || "EMAIL_VERIFICATION",
    attempts: data.attempts || 0,
    maxAttempts: data.maxAttempts || 3,
    expiresAt: data.expiresAt || new Date(Date.now() + 10 * 60 * 1000),
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    save: async function () {
      this.updatedAt = new Date();
      return this;
    },
  };
  return doc;
}

// Mock Mongoose models
vi.mock("../modules/auth/models/user.model", () => ({
  User: {
    findOne: vi.fn(async (query: { email?: string }) => {
      if (query.email) {
        return mockUsers.find((u) => u.email.toLowerCase() === query.email?.toLowerCase()) || null;
      }
      return null;
    }),
    findById: vi.fn(async (id: unknown) => {
      const idStr = id?.toString();
      return mockUsers.find((u) => u._id.toString() === idStr) || null;
    }),
    create: vi.fn(async (data: Partial<MockUserDoc>) => {
      const doc = makeUserDoc(data);
      mockUsers.push(doc);
      return doc;
    }),
  },
}));

vi.mock("../modules/auth/models/session.model", () => ({
  Session: {
    create: vi.fn(async (data: Partial<MockSessionDoc>) => {
      const doc = makeSessionDoc(data);
      mockSessions.push(doc);
      return doc;
    }),
    findOne: vi.fn(async (query: { refreshTokenHash?: string }) => {
      if (query.refreshTokenHash) {
        return mockSessions.find((s) => s.refreshTokenHash === query.refreshTokenHash) || null;
      }
      return null;
    }),
    findById: vi.fn(async (id: unknown) => {
      const idStr = id?.toString();
      return mockSessions.find((s) => s._id.toString() === idStr) || null;
    }),
    find: vi.fn((query: { userId?: unknown; isRevoked?: boolean }) => {
      const userIdStr = query.userId?.toString();
      const filtered = mockSessions.filter((s) => {
        if (userIdStr && s.userId.toString() !== userIdStr) return false;
        if (query.isRevoked !== undefined && s.isRevoked !== query.isRevoked) return false;
        return true;
      });
      return {
        sort: vi.fn().mockResolvedValue(filtered),
      };
    }),
    updateOne: vi.fn(
      async (
        filter: { _id?: unknown; refreshTokenHash?: string; userId?: unknown },
        update: { isRevoked?: boolean }
      ) => {
        let found = false;
        for (const s of mockSessions) {
          if (filter.refreshTokenHash && s.refreshTokenHash === filter.refreshTokenHash) {
            if (update.isRevoked !== undefined) s.isRevoked = update.isRevoked;
            found = true;
          } else if (filter._id && s._id.toString() === filter._id.toString()) {
            if (update.isRevoked !== undefined) s.isRevoked = update.isRevoked;
            found = true;
          }
        }
        return { matchedCount: found ? 1 : 0 };
      }
    ),
    updateMany: vi.fn(
      async (filter: { familyId?: string; userId?: unknown }, update: { isRevoked?: boolean }) => {
        let count = 0;
        for (const s of mockSessions) {
          if (filter.familyId && s.familyId === filter.familyId) {
            if (update.isRevoked !== undefined) s.isRevoked = update.isRevoked;
            count++;
          } else if (filter.userId && s.userId.toString() === filter.userId.toString()) {
            if (update.isRevoked !== undefined) s.isRevoked = update.isRevoked;
            count++;
          }
        }
        return { matchedCount: count, modifiedCount: count };
      }
    ),
  },
}));

vi.mock("../modules/auth/models/otp.model", () => ({
  Otp: {
    create: vi.fn(async (data: Partial<MockOtpDoc>) => {
      const doc = makeOtpDoc(data);
      mockOtps.push(doc);
      return doc;
    }),
    findOne: vi.fn(async (query: { email?: string; type?: string }) => {
      return (
        mockOtps.find(
          (o) =>
            o.email.toLowerCase() === query.email?.toLowerCase() &&
            (!query.type || o.type === query.type)
        ) || null
      );
    }),
    deleteOne: vi.fn(async (filter: { _id?: unknown }) => {
      const idx = mockOtps.findIndex((o) => o._id.toString() === filter._id?.toString());
      if (idx !== -1) mockOtps.splice(idx, 1);
      return { deletedCount: idx !== -1 ? 1 : 0 };
    }),
    deleteMany: vi.fn(async (filter: { email?: string; type?: string }) => {
      let count = 0;
      for (let i = mockOtps.length - 1; i >= 0; i--) {
        const item = mockOtps[i];
        if (
          item &&
          item.email.toLowerCase() === filter.email?.toLowerCase() &&
          (!filter.type || item.type === filter.type)
        ) {
          mockOtps.splice(i, 1);
          count++;
        }
      }
      return { deletedCount: count };
    }),
  },
}));

describe("Authentication & Authorization System", () => {
  const app = createApp();

  beforeEach(() => {
    mockUsers.length = 0;
    mockSessions.length = 0;
    mockOtps.length = 0;
    vi.clearAllMocks();
  });

  describe("PasswordService", () => {
    it("hashes a password securely and verifies match", async () => {
      const password = "Password123!";
      const hash = await passwordService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2")).toBe(true);

      const isValid = await passwordService.comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await passwordService.comparePassword("WrongPassword1!", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("TokenService", () => {
    it("generates and verifies access and refresh tokens", () => {
      const user = makeUserDoc({
        email: "alice@example.com",
        role: "customer",
        permissions: [],
      });
      const sessionId = new mongoose.Types.ObjectId().toString();
      const familyId = "family-123";

      const tokens = tokenService.generateTokens(user as unknown as IUser, sessionId, familyId);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeGreaterThan(0);

      const verifiedAccess = tokenService.verifyAccessToken(tokens.accessToken);
      expect(verifiedAccess.sub).toBe(user._id.toString());
      expect(verifiedAccess.email).toBe("alice@example.com");
      expect(verifiedAccess.role).toBe("customer");
      expect(verifiedAccess.sessionId).toBe(sessionId);

      const verifiedRefresh = tokenService.verifyRefreshToken(tokens.refreshToken);
      expect(verifiedRefresh.sub).toBe(user._id.toString());
      expect(verifiedRefresh.sessionId).toBe(sessionId);
      expect(verifiedRefresh.familyId).toBe(familyId);
    });

    it("creates consistent SHA-256 token hash", () => {
      const token = "some-refresh-token-value";
      const hash1 = tokenService.hashToken(token);
      const hash2 = tokenService.hashToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe("OtpService", () => {
    it("generates a 6-digit numeric OTP", () => {
      const otp = otpService.generateOtp();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it("saves and verifies a valid OTP code", async () => {
      const email = "test@example.com";
      const otp = "123456";

      await otpService.saveOtp(email, otp, "EMAIL_VERIFICATION");
      expect(mockOtps).toHaveLength(1);

      const result = await otpService.verifyOtp(email, otp, "EMAIL_VERIFICATION");
      expect(result).toBe(true);
      // Once verified, OTP record is deleted to prevent replay
      expect(mockOtps).toHaveLength(0);
    });

    it("rejects an invalid OTP code and increments attempts", async () => {
      const email = "test@example.com";
      const otp = "123456";

      await otpService.saveOtp(email, otp, "EMAIL_VERIFICATION");

      await expect(otpService.verifyOtp(email, "654321", "EMAIL_VERIFICATION")).rejects.toThrow(
        /Invalid OTP code/
      );

      expect(mockOtps[0]?.attempts).toBe(1);
    });

    it("rejects an expired OTP code", async () => {
      const email = "test@example.com";
      const otp = "123456";

      await otpService.saveOtp(email, otp, "EMAIL_VERIFICATION");
      // Set expiry to past
      if (mockOtps[0]) {
        mockOtps[0].expiresAt = new Date(Date.now() - 10000);
      }

      await expect(otpService.verifyOtp(email, otp, "EMAIL_VERIFICATION")).rejects.toThrow(
        /expired/i
      );
    });
  });

  describe("Customer Registration & Verification Endpoints", () => {
    it("registers a customer successfully (POST /api/v1/auth/register)", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "customer@example.com",
        password: "SecurePassword123!",
        firstName: "John",
        lastName: "Doe",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("AUTH_REGISTER_SUCCESS");
      expect(res.body.message).toBe(
        "Registration successful. Please verify your email with the OTP code sent."
      );
      expect(res.body.meta?.requestId).toBeDefined();
      expect(res.body.data.user.email).toBe("customer@example.com");
      expect(res.body.data.user.isEmailVerified).toBe(false);
      expect(res.body.data.refreshToken).toBeUndefined();
      expect(res.body.data.otp).toBeDefined(); // returned in test env
    });

    it("returns 409 Conflict if email is already registered", async () => {
      mockUsers.push(
        makeUserDoc({
          email: "existing@example.com",
          passwordHash: "hash",
          firstName: "Existing",
          lastName: "User",
        })
      );

      const res = await request(app).post("/api/v1/auth/register").send({
        email: "existing@example.com",
        password: "SecurePassword123!",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("returns 422 Validation Error on weak password", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "short",
        firstName: "John",
        lastName: "Doe",
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("verifies customer email with valid OTP (POST /api/v1/auth/verify-email)", async () => {
      const user = makeUserDoc({
        email: "verify@example.com",
        passwordHash: "hash",
        firstName: "Verify",
        lastName: "User",
        isEmailVerified: false,
      });
      mockUsers.push(user);

      const otp = "654321";
      await otpService.saveOtp(user.email, otp, "EMAIL_VERIFICATION");

      const res = await request(app).post("/api/v1/auth/verify-email").send({
        email: "verify@example.com",
        otp,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("OTP_VERIFIED");
      expect(res.body.message).toBe("Your email address has been verified successfully.");
      expect(res.body.meta?.requestId).toBeDefined();
      expect(res.body.data.user.isEmailVerified).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeUndefined();

      // Check HTTP-only cookie set
      const cookies = res.headers["set-cookie"] as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.[0]).toMatch(/refreshToken=/);
      expect(cookies?.[0]).toMatch(/HttpOnly/i);
    });
  });

  describe("Customer & Admin Login", () => {
    it("logs in verified customer with valid credentials (POST /api/v1/auth/login)", async () => {
      const password = "CorrectPassword123!";
      const passwordHash = await passwordService.hashPassword(password);
      mockUsers.push(
        makeUserDoc({
          email: "customer@example.com",
          passwordHash,
          firstName: "Jane",
          lastName: "Doe",
          isEmailVerified: true,
          role: "customer",
        })
      );

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "customer@example.com",
        password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("AUTH_LOGIN_SUCCESS");
      expect(res.body.message).toBe("Welcome back! You have successfully signed in.");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeUndefined();
      expect(res.body.data.user.email).toBe("customer@example.com");
    });

    it("rejects login with invalid credentials", async () => {
      const passwordHash = await passwordService.hashPassword("CorrectPassword123!");
      mockUsers.push(
        makeUserDoc({
          email: "customer@example.com",
          passwordHash,
          isEmailVerified: true,
        })
      );

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "customer@example.com",
        password: "WrongPassword999!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("rejects login if email is unverified", async () => {
      const password = "CorrectPassword123!";
      const passwordHash = await passwordService.hashPassword(password);
      mockUsers.push(
        makeUserDoc({
          email: "unverified@example.com",
          passwordHash,
          isEmailVerified: false,
        })
      );

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "unverified@example.com",
        password,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
      expect(res.body.message).toBe("Please verify your email address before signing in.");
      expect(res.body.meta?.requestId).toBeDefined();
      expect(res.body.error.details?.[0]?.code).toBe("EMAIL_NOT_VERIFIED");
    });

    it("demonstrates the canonical EMAIL_NOT_VERIFIED response contract (Acceptance Check)", async () => {
      const password = "CorrectPassword123!";
      const passwordHash = await passwordService.hashPassword(password);
      mockUsers.push(
        makeUserDoc({
          email: "unverified-demo@example.com",
          passwordHash,
          isEmailVerified: false,
        })
      );

      const customRequestId = "test-request-id-acceptance-123";
      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("X-Request-Id", customRequestId)
        .send({
          email: "unverified-demo@example.com",
          password,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
      expect(res.body.message).toBe("Please verify your email address before signing in.");
      expect(res.body.meta.requestId).toBe(customRequestId);
    });

    it("allows admin login for admin role (POST /api/v1/auth/admin/login)", async () => {
      const password = "AdminPassword123!";
      const passwordHash = await passwordService.hashPassword(password);
      mockUsers.push(
        makeUserDoc({
          email: "admin@veyora.local",
          passwordHash,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          isEmailVerified: true,
        })
      );

      const res = await request(app).post("/api/v1/auth/admin/login").send({
        email: "admin@veyora.local",
        password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("AUTH_LOGIN_SUCCESS");
      expect(res.body.data.user.role).toBe("admin");
      expect(res.body.data.refreshToken).toBeUndefined();
    });

    it("denies admin login for customer role (403 Forbidden)", async () => {
      const password = "CustomerPassword123!";
      const passwordHash = await passwordService.hashPassword(password);
      mockUsers.push(
        makeUserDoc({
          email: "customer@example.com",
          passwordHash,
          role: "customer",
          isEmailVerified: true,
        })
      );

      const res = await request(app).post("/api/v1/auth/admin/login").send({
        email: "customer@example.com",
        password,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Token Refresh & Rotation", () => {
    it("rotates refresh token and generates new access token (POST /api/v1/auth/refresh)", async () => {
      const user = makeUserDoc({
        email: "user@example.com",
        role: "customer",
      });
      mockUsers.push(user);

      const familyId = "fam-100";
      const oldSession = makeSessionDoc({
        userId: user._id,
        familyId,
        isRevoked: false,
      });
      mockSessions.push(oldSession);

      const tokens = tokenService.generateTokens(
        user as unknown as IUser,
        oldSession._id.toString(),
        familyId
      );
      oldSession.refreshTokenHash = tokenService.hashToken(tokens.refreshToken);

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [`refreshToken=${tokens.refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("SESSION_REFRESHED");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeUndefined();

      // Old session must be marked revoked
      expect(oldSession.isRevoked).toBe(true);
      // New session created in the same family
      expect(mockSessions.length).toBe(2);
      expect(mockSessions[1]?.familyId).toBe(familyId);
      expect(mockSessions[1]?.isRevoked).toBe(false);
    });

    it("detects token reuse and revokes entire token family", async () => {
      const user = makeUserDoc({ email: "user@example.com" });
      mockUsers.push(user);

      const familyId = "compromised-family";
      const session1 = makeSessionDoc({
        userId: user._id,
        familyId,
        isRevoked: true, // Already rotated/revoked
        refreshTokenHash: "old-hash",
      });
      const session2 = makeSessionDoc({
        userId: user._id,
        familyId,
        isRevoked: false,
        refreshTokenHash: "current-hash",
      });
      mockSessions.push(session1, session2);

      // Create a token pointing to session1
      const tokens = tokenService.generateTokens(
        user as unknown as IUser,
        session1._id.toString(),
        familyId
      );
      session1.refreshTokenHash = tokenService.hashToken(tokens.refreshToken);

      // Attacker replays old tokens.refreshToken
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: tokens.refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("SESSION_REVOKED");
      // Both sessions in family must now be revoked!
      expect(session1.isRevoked).toBe(true);
      expect(session2.isRevoked).toBe(true);
    });
  });

  describe("Password Reset Flow", () => {
    it("dispatches OTP on forgot-password (POST /api/v1/auth/forgot-password)", async () => {
      mockUsers.push(
        makeUserDoc({
          email: "user@example.com",
          passwordHash: "old-hash",
        })
      );

      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "user@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("PASSWORD_RESET_REQUEST_RECEIVED");
      expect(mockOtps).toHaveLength(1);
      expect(mockOtps[0]?.type).toBe("PASSWORD_RESET");
    });

    it("preserves account enumeration safety for non-existent email on forgot-password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nonexistent-ghost@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("PASSWORD_RESET_REQUEST_RECEIVED");
      expect(res.body.message).toContain("If an account exists with this email address");
    });

    it("resets password and revokes all user sessions (POST /api/v1/auth/reset-password)", async () => {
      const user = makeUserDoc({
        email: "user@example.com",
        passwordHash: "old-hash",
      });
      mockUsers.push(user);

      const activeSession = makeSessionDoc({
        userId: user._id,
        isRevoked: false,
      });
      mockSessions.push(activeSession);

      const otp = "999888";
      await otpService.saveOtp(user.email, otp, "PASSWORD_RESET");

      const res = await request(app).post("/api/v1/auth/reset-password").send({
        email: "user@example.com",
        otp,
        newPassword: "BrandNewPassword123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("PASSWORD_RESET_SUCCESS");

      // Password must have changed
      const isNewValid = await passwordService.comparePassword(
        "BrandNewPassword123!",
        user.passwordHash
      );
      expect(isNewValid).toBe(true);

      // All active sessions must be revoked
      expect(activeSession.isRevoked).toBe(true);
    });
  });

  describe("Protected Routes & RBAC Middleware", () => {
    it("returns 401 Unauthorized for GET /api/v1/auth/me without token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns user profile for valid Bearer token", async () => {
      const user = makeUserDoc({
        email: "profile@example.com",
        firstName: "Profile",
        lastName: "User",
        role: "customer",
      });
      mockUsers.push(user);

      const session = makeSessionDoc({
        userId: user._id,
        isRevoked: false,
      });
      mockSessions.push(session);

      const tokens = tokenService.generateTokens(
        user as unknown as IUser,
        session._id.toString(),
        "fam"
      );

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("AUTH_USER_FETCHED");
      expect(res.body.data.email).toBe("profile@example.com");
    });

    it("logs out and revokes session (POST /api/v1/auth/logout)", async () => {
      const session = makeSessionDoc({
        isRevoked: false,
        refreshTokenHash: tokenService.hashToken("some-refresh-token"),
      });
      mockSessions.push(session);

      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", ["refreshToken=some-refresh-token"]);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("AUTH_LOGOUT_SUCCESS");
      expect(session.isRevoked).toBe(true);
      // Cookie cleared
      const cookies = res.headers["set-cookie"] as string[] | undefined;
      expect(cookies?.[0]).toMatch(/refreshToken=;/);
    });

    it("resends OTP with stable code (POST /api/v1/auth/resend-otp)", async () => {
      const user = makeUserDoc({
        email: "resend@example.com",
        passwordHash: "hash",
        isEmailVerified: false,
      });
      mockUsers.push(user);

      const res = await request(app).post("/api/v1/auth/resend-otp").send({
        email: "resend@example.com",
        type: "EMAIL_VERIFICATION",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("OTP_RESENT");
      expect(res.body.meta?.requestId).toBeDefined();
    });

    it("retrieves active sessions with stable code (GET /api/v1/auth/sessions)", async () => {
      const user = makeUserDoc({ email: "sessions@example.com" });
      mockUsers.push(user);

      const session = makeSessionDoc({
        userId: user._id,
        isRevoked: false,
      });
      mockSessions.push(session);

      const tokens = tokenService.generateTokens(
        user as unknown as IUser,
        session._id.toString(),
        "fam-sessions"
      );

      const res = await request(app)
        .get("/api/v1/auth/sessions")
        .set("Authorization", `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("AUTH_SESSIONS_FETCHED");
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("revokes a session with stable code (DELETE /api/v1/auth/sessions/:sessionId)", async () => {
      const user = makeUserDoc({ email: "revoke@example.com" });
      mockUsers.push(user);

      const session = makeSessionDoc({
        userId: user._id,
        isRevoked: false,
      });
      mockSessions.push(session);

      const tokens = tokenService.generateTokens(
        user as unknown as IUser,
        session._id.toString(),
        "fam-revoke"
      );

      const targetSession = makeSessionDoc({
        userId: user._id,
        isRevoked: false,
      });
      mockSessions.push(targetSession);

      const res = await request(app)
        .delete(`/api/v1/auth/sessions/${targetSession._id}`)
        .set("Authorization", `Bearer ${tokens.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe("AUTH_SESSION_REVOKED");
      expect(targetSession.isRevoked).toBe(true);
    });
  });
});
