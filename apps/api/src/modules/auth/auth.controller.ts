import { Request, Response, NextFunction } from "express";
import { authService, RequestMetadata } from "./services/auth.service";
import { env } from "../../config/env";
import { UnauthorizedError } from "@veyora/utils";
import { sendSuccess } from "../../utils/response";
import {
  AUTH_COOKIE_NAME,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "./config/auth-cookie.config";

export { setRefreshTokenCookie, clearRefreshTokenCookie };
const COOKIE_NAME = AUTH_COOKIE_NAME;

function getRequestMetadata(req: Request): RequestMetadata {
  return {
    userAgent: req.headers["user-agent"] || "",
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "",
  };
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = getRequestMetadata(req);
      const result = await authService.register(req.body, meta);

      sendSuccess(res, {
        statusCode: 201,
        code: "AUTH_REGISTER_SUCCESS",
        message: "Registration successful. Please verify your email with the OTP code sent.",
        data: {
          user: result.user,
          message: "Registration successful. Please verify your email with the OTP code sent.",
          ...(env.NODE_ENV !== "production" && { otp: result.otp }),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const meta = getRequestMetadata(req);
      const { user, tokens } = await authService.verifyEmail(email, otp, meta);

      setRefreshTokenCookie(res, tokens.refreshToken);

      sendSuccess(res, {
        statusCode: 200,
        code: "OTP_VERIFIED",
        message: "Your email address has been verified successfully.",
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, type } = req.body;
      const result = await authService.resendOtp(email, type);

      sendSuccess(res, {
        statusCode: 200,
        code: "OTP_RESENT",
        message: result.message || "Verification code sent successfully.",
        data: {
          message: result.message,
          ...(env.NODE_ENV !== "production" && { otp: result.otp }),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = getRequestMetadata(req);
      const { user, tokens } = await authService.login(req.body, meta);

      setRefreshTokenCookie(res, tokens.refreshToken);

      sendSuccess(res, {
        statusCode: 200,
        code: "AUTH_LOGIN_SUCCESS",
        message: "Welcome back! You have successfully signed in.",
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = getRequestMetadata(req);
      const { user, tokens } = await authService.adminLogin(req.body, meta);

      setRefreshTokenCookie(res, tokens.refreshToken);

      sendSuccess(res, {
        statusCode: 200,
        code: "AUTH_LOGIN_SUCCESS",
        message: "Welcome back, Administrator! You have successfully signed in.",
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      if (!rawRefreshToken) {
        throw new UnauthorizedError(
          "Refresh token is required.",
          undefined,
          "INVALID_REFRESH_TOKEN"
        );
      }

      const meta = getRequestMetadata(req);
      const { user, tokens } = await authService.refreshTokens(rawRefreshToken, meta);

      setRefreshTokenCookie(res, tokens.refreshToken);

      sendSuccess(res, {
        statusCode: 200,
        code: "SESSION_REFRESHED",
        message: "Your session has been refreshed successfully.",
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      await authService.logout(rawRefreshToken, req.sessionId);

      clearRefreshTokenCookie(res);

      sendSuccess(res, {
        statusCode: 200,
        code: "AUTH_LOGOUT_SUCCESS",
        message: "Logged out successfully.",
        data: {
          message: "Logged out successfully.",
          loggedOut: true,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      sendSuccess(res, {
        statusCode: 200,
        code: "PASSWORD_RESET_REQUEST_RECEIVED",
        message:
          result.message ||
          "If an account exists with this email address, a password reset code has been sent.",
        data: {
          message: result.message,
          ...(env.NODE_ENV !== "production" && result.otp && { otp: result.otp }),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);

      clearRefreshTokenCookie(res);

      sendSuccess(res, {
        statusCode: 200,
        code: "PASSWORD_RESET_SUCCESS",
        message:
          result.message || "Password reset successful. Please log in with your new password.",
        data: {
          message: result.message,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required.");
      }

      const user = await authService.getUserById(req.user.id);

      sendSuccess(res, {
        statusCode: 200,
        code: "AUTH_USER_FETCHED",
        message: "User profile retrieved successfully.",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required.");
      }

      const sessions = await authService.getUserSessions(req.user.id, req.sessionId);

      sendSuccess(res, {
        statusCode: 200,
        code: "AUTH_SESSIONS_FETCHED",
        message: "Active sessions retrieved successfully.",
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required.");
      }

      const sessionId = req.params.sessionId;
      if (!sessionId) {
        throw new UnauthorizedError("Session ID is required.");
      }

      await authService.revokeSession(req.user.id, sessionId);

      sendSuccess(res, {
        statusCode: 200,
        code: "AUTH_SESSION_REVOKED",
        message: "Session successfully revoked.",
        data: {
          message: "Session successfully revoked.",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
