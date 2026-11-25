import crypto from "crypto";
import { User, IUser } from "../models/user.model";
import { Session } from "../models/session.model";
import { passwordService } from "./password.service";
import { tokenService } from "./token.service";
import { otpService } from "./otp.service";
import { AuthUser, AuthTokens, SessionInfo, OtpType } from "@veyora/types";
import { RegisterInput, LoginInput, ResetPasswordInput } from "@veyora/validators";
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@veyora/utils";
import { env } from "../../../config/env";
import { logger } from "../../../config/logger";

export interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  private toAuthUser(user: IUser): AuthUser {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      isEmailVerified: user.isEmailVerified,
    };
  }

  /**
   * Register a new customer
   */
  async register(
    input: RegisterInput,
    _meta?: RequestMetadata
  ): Promise<{ user: AuthUser; otp: string }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictError("An account with this email address already exists.");
    }

    const passwordHash = await passwordService.hashPassword(input.password);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: "customer",
      permissions: [],
      isEmailVerified: false,
      isActive: true,
    });

    const otp = otpService.generateOtp();
    await otpService.saveOtp(user.email, otp, "EMAIL_VERIFICATION");

    logger.info(
      { userId: user._id.toString(), email: user.email },
      "User registered successfully. Email verification OTP issued."
    );

    return {
      user: this.toAuthUser(user),
      otp, // Provided for testing and development notification dispatch
    };
  }

  /**
   * Verify email using OTP and automatically issue session tokens
   */
  async verifyEmail(
    email: string,
    otp: string,
    meta?: RequestMetadata
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const normalizedEmail = email.toLowerCase().trim();

    await otpService.verifyOtp(normalizedEmail, otp, "EMAIL_VERIFICATION");

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new NotFoundError("Account not found.");
    }

    user.isEmailVerified = true;
    await user.save();

    // Create session and tokens
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    const session = await Session.create({
      userId: user._id,
      refreshTokenHash: "pending",
      familyId,
      userAgent: meta?.userAgent || "",
      ipAddress: meta?.ipAddress || "",
      isRevoked: false,
      expiresAt,
    });

    const tokens = tokenService.generateTokens(user, session._id.toString(), familyId);
    session.refreshTokenHash = tokenService.hashToken(tokens.refreshToken);
    await session.save();

    logger.info(
      { userId: user._id.toString(), email: user.email },
      "User email verified and initial session established."
    );

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  /**
   * Resend OTP code for email verification or password reset
   */
  async resendOtp(email: string, type: OtpType): Promise<{ message: string; otp: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new NotFoundError("No account found with this email address.");
    }

    if (type === "EMAIL_VERIFICATION" && user.isEmailVerified) {
      throw new BadRequestError("This email address has already been verified.");
    }

    const otp = otpService.generateOtp();
    await otpService.saveOtp(normalizedEmail, otp, type);

    logger.info({ email: normalizedEmail, type }, "New OTP generated and dispatched.");

    return {
      message: "Verification code sent successfully.",
      otp,
    };
  }

  /**
   * Customer Login
   */
  async login(
    input: LoginInput,
    meta?: RequestMetadata
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.", undefined, "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw new AppError({
        statusCode: 403,
        code: "ACCOUNT_INACTIVE",
        message: "Your account has been deactivated. Please contact customer support.",
      });
    }

    const isMatch = await passwordService.comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password.", undefined, "INVALID_CREDENTIALS");
    }

    if (!user.isEmailVerified) {
      throw new AppError({
        statusCode: 401,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before signing in.",
        details: [{ field: "email", message: "Email not verified", code: "EMAIL_NOT_VERIFIED" }],
      });
    }

    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    const session = await Session.create({
      userId: user._id,
      refreshTokenHash: "pending",
      familyId,
      userAgent: meta?.userAgent || "",
      ipAddress: meta?.ipAddress || "",
      isRevoked: false,
      expiresAt,
    });

    const tokens = tokenService.generateTokens(user, session._id.toString(), familyId);
    session.refreshTokenHash = tokenService.hashToken(tokens.refreshToken);
    await session.save();

    logger.info(
      { userId: user._id.toString(), email: user.email, role: user.role },
      "User logged in successfully."
    );

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  /**
   * Admin Login (enforces admin or superadmin role)
   */
  async adminLogin(
    input: LoginInput,
    meta?: RequestMetadata
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.", undefined, "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw new AppError({
        statusCode: 403,
        code: "ACCOUNT_INACTIVE",
        message: "Your account has been deactivated. Please contact customer support.",
      });
    }

    const isMatch = await passwordService.comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password.", undefined, "INVALID_CREDENTIALS");
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      logger.warn(
        { userId: user._id.toString(), email: user.email, role: user.role },
        "Unauthorized admin login attempt."
      );
      throw new ForbiddenError(
        "Access denied. Administrator privileges required.",
        undefined,
        "FORBIDDEN"
      );
    }

    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    const session = await Session.create({
      userId: user._id,
      refreshTokenHash: "pending",
      familyId,
      userAgent: meta?.userAgent || "",
      ipAddress: meta?.ipAddress || "",
      isRevoked: false,
      expiresAt,
    });

    const tokens = tokenService.generateTokens(user, session._id.toString(), familyId);
    session.refreshTokenHash = tokenService.hashToken(tokens.refreshToken);
    await session.save();

    logger.info(
      { userId: user._id.toString(), email: user.email, role: user.role },
      "Administrator authenticated successfully."
    );

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token with Refresh Token Rotation and Family Reuse Detection
   */
  async refreshTokens(
    rawRefreshToken: string,
    meta?: RequestMetadata
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError("Refresh token is required.", undefined, "INVALID_REFRESH_TOKEN");
    }

    let payload: { sub: string; sessionId: string; familyId: string };
    try {
      payload = tokenService.verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError(
        "Invalid or expired refresh token.",
        undefined,
        "INVALID_REFRESH_TOKEN"
      );
    }

    const hashedToken = tokenService.hashToken(rawRefreshToken);
    const session = await Session.findOne({ refreshTokenHash: hashedToken });

    if (!session) {
      // Token reuse detection! A token with valid signature but unknown hash was submitted.
      // If any sessions exist in this token family, revoke all of them immediately.
      logger.warn(
        { familyId: payload.familyId, sub: payload.sub },
        "Security Alert: Refresh token reuse detected. Revoking entire token family."
      );
      await Session.updateMany({ familyId: payload.familyId }, { isRevoked: true });
      throw new UnauthorizedError(
        "Security alert: Refresh token reuse detected. All sessions have been revoked. Please log in again.",
        undefined,
        "SESSION_REVOKED"
      );
    }

    if (session.isRevoked) {
      // Check for concurrent refresh race condition within a 15-second grace window
      const gracePeriodMs = 15000;
      const isWithinGrace =
        session.updatedAt && Date.now() - session.updatedAt.getTime() < gracePeriodMs;

      if (isWithinGrace) {
        const activeSession = await Session.findOne({
          familyId: session.familyId,
          isRevoked: false,
          expiresAt: { $gt: new Date() },
        });

        if (activeSession) {
          const user = await User.findById(activeSession.userId);
          if (user && user.isActive) {
            logger.info(
              { sessionId: session._id.toString(), familyId: session.familyId },
              "Concurrent refresh handled within rotation grace period."
            );
            const tokens = tokenService.generateTokens(
              user,
              activeSession._id.toString(),
              activeSession.familyId
            );
            activeSession.refreshTokenHash = tokenService.hashToken(tokens.refreshToken);
            await activeSession.save();
            return {
              user: this.toAuthUser(user),
              tokens,
            };
          }
        }
      }

      logger.warn(
        { sessionId: session._id.toString(), familyId: session.familyId },
        "Attempt to use an already revoked session token. Revoking entire token family."
      );
      await Session.updateMany({ familyId: session.familyId }, { isRevoked: true });
      throw new UnauthorizedError(
        "Session has been revoked. Please log in again.",
        undefined,
        "SESSION_REVOKED"
      );
    }

    if (session.expiresAt.getTime() < Date.now()) {
      session.isRevoked = true;
      await session.save();
      throw new UnauthorizedError(
        "Session expired. Please log in again.",
        undefined,
        "SESSION_EXPIRED"
      );
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      session.isRevoked = true;
      await session.save();
      throw new UnauthorizedError(
        "User account is inactive or not found.",
        undefined,
        "ACCOUNT_INACTIVE"
      );
    }

    // ROTATION: Revoke the used session and issue a new one in the same family
    session.isRevoked = true;
    await session.save();

    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
    const newSession = await Session.create({
      userId: user._id,
      refreshTokenHash: "pending",
      familyId: session.familyId,
      userAgent: meta?.userAgent || session.userAgent,
      ipAddress: meta?.ipAddress || session.ipAddress,
      isRevoked: false,
      expiresAt,
    });

    const tokens = tokenService.generateTokens(user, newSession._id.toString(), session.familyId);
    newSession.refreshTokenHash = tokenService.hashToken(tokens.refreshToken);
    await newSession.save();

    logger.debug(
      { userId: user._id.toString(), familyId: session.familyId },
      "Tokens rotated successfully."
    );

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  /**
   * Logout user / revoke active session
   */
  async logout(rawRefreshToken?: string, sessionId?: string): Promise<void> {
    if (rawRefreshToken) {
      const hashed = tokenService.hashToken(rawRefreshToken);
      await Session.updateOne({ refreshTokenHash: hashed }, { isRevoked: true });
    }
    if (sessionId) {
      await Session.updateOne({ _id: sessionId }, { isRevoked: true });
    }
  }

  /**
   * Request password reset OTP
   */
  async forgotPassword(email: string): Promise<{ message: string; otp?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Prevent email enumeration: always return the same generic message
    if (!user) {
      return {
        message:
          "If an account exists with this email address, a password reset code has been sent.",
      };
    }

    const otp = otpService.generateOtp();
    await otpService.saveOtp(normalizedEmail, otp, "PASSWORD_RESET");

    logger.info({ email: normalizedEmail }, "Password reset OTP generated.");

    return {
      message: "If an account exists with this email address, a password reset code has been sent.",
      otp, // Provided for dev/testing
    };
  }

  /**
   * Reset password with verified OTP and invalidate all active sessions
   */
  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    await otpService.verifyOtp(normalizedEmail, input.otp, "PASSWORD_RESET");

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new NotFoundError("Account not found.");
    }

    user.passwordHash = await passwordService.hashPassword(input.newPassword);
    // Resetting password via email verification inherently verifies ownership of the email
    user.isEmailVerified = true;
    await user.save();

    // Revoke all active sessions for this user on password change
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    logger.info(
      { userId: user._id.toString(), email: user.email },
      "Password reset successful. All previous user sessions revoked."
    );

    return {
      message: "Password reset successful. Please log in with your new password.",
    };
  }

  /**
   * Get active user sessions
   */
  async getUserSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
    const sessions = await Session.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ updatedAt: -1 });

    return sessions.map((s) => ({
      id: s._id.toString(),
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt.toISOString(),
      lastActiveAt: s.updatedAt.toISOString(),
      isCurrent: currentSessionId ? s._id.toString() === currentSessionId : false,
    }));
  }

  /**
   * Revoke a specific user session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await Session.updateOne(
      { _id: sessionId, userId, isRevoked: false },
      { isRevoked: true }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError("Session not found or already revoked.");
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<AuthUser> {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundError("User not found or account is deactivated.");
    }
    return this.toAuthUser(user);
  }
}

export const authService = new AuthService();
