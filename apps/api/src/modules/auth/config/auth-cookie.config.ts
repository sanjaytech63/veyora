import { CookieOptions, Response } from "express";
import { env } from "../../../config/env";

export const AUTH_COOKIE_NAME = "refreshToken";

/**
 * Standardized cookie options for session refresh tokens
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  };
}

/**
 * Cookie options for clearing the refresh token cookie on logout / session revocation.
 * Path, domain, secure, and sameSite must exactly match the set options.
 */
export function getClearRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  };
}

/**
 * Sets the refresh token HTTP-only cookie on the Express response
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, getRefreshTokenCookieOptions());
}

/**
 * Clears the refresh token HTTP-only cookie on the Express response
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, getClearRefreshTokenCookieOptions());
}
