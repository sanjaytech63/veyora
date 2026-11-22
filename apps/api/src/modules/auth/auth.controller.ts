import { Request, Response, NextFunction } from "express";
import { authService, RequestMetadata } from "./services/auth.service";
import { env } from "../../config/env";
import { UnauthorizedError } from "@veyora/utils";
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

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          message: "Registration successful. Please verify your email with the OTP code sent.",
          ...(env.NODE_ENV !== "production" && { otp: result.otp }),
        },
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, type } = req.body;
      const result = await authService.resendOtp(email, type);

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          ...(env.NODE_ENV !== "production" && { otp: result.otp }),
        },
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
      if (!rawRefreshToken) {
        throw new UnauthorizedError("Refresh token is required.");
      }

      const meta = getRequestMetadata(req);
      const { user, tokens } = await authService.refreshTokens(rawRefreshToken, meta);

      setRefreshTokenCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: {
          message: "Logged out successfully.",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          ...(env.NODE_ENV !== "production" && result.otp && { otp: result.otp }),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);

      clearRefreshTokenCookie(res);

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
        },
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: sessions,
        timestamp: new Date().toISOString(),
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

      res.status(200).json({
        success: true,
        data: {
          message: "Session successfully revoked.",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
