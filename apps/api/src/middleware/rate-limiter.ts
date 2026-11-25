import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { ApiResponseError } from "@veyora/types";
import { Request, Response } from "express";

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    const errorResponse: ApiResponseError = {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
      },
      timestamp: new Date().toISOString(),
    };

    res.status(429).json(errorResponse);
  },
});

function createLimiter(windowMs: number, max: number, code: string, message: string) {
  return rateLimit({
    windowMs,
    max: env.NODE_ENV === "test" ? 10000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    handler: (_req: Request, res: Response) => {
      const errorResponse: ApiResponseError = {
        success: false,
        error: {
          code,
          message,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(429).json(errorResponse);
    },
  });
}

/**
 * Strict rate limiter for login and sensitive credential authentication (Brute-force protection)
 */
export const authRateLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "AUTH_RATE_LIMIT_EXCEEDED",
  "Too many authentication attempts. Please try again after 15 minutes."
);

/**
 * Rate limiter for token refresh requests to mitigate automated token rotation flooding
 */
export const refreshRateLimiter = createLimiter(
  15 * 60 * 1000,
  60,
  "REFRESH_RATE_LIMIT_EXCEEDED",
  "Too many token refresh attempts. Please try again later."
);

/**
 * Strict rate limiter for OTP requests, email verification, and password resets
 */
export const otpRateLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "OTP_RATE_LIMIT_EXCEEDED",
  "Too many verification attempts. Please wait 15 minutes before requesting another code."
);

/**
 * Payment initiation & verification rate limiter to mitigate automated fraud & card testing
 */
export const paymentRateLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  "PAYMENT_RATE_LIMIT_EXCEEDED",
  "Too many payment attempts. Please wait before retrying."
);

/**
 * Coupon validation rate limiter to prevent automated dictionary / brute-force voucher discovery
 */
export const couponRateLimiter = createLimiter(
  15 * 60 * 1000,
  15,
  "COUPON_RATE_LIMIT_EXCEEDED",
  "Too many coupon validation attempts. Please try again later."
);
