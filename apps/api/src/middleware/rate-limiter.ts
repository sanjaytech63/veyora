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
