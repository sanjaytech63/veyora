import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "req.headers['x-internal-cache-secret']",
      "req.headers['x-razorpay-signature']",
      "password",
      "currentPassword",
      "newPassword",
      "confirmPassword",
      "token",
      "secret",
      "refreshToken",
      "accessToken",
      "otp",
      "signature",
      "razorpay_signature",
      "creditCard",
      "cvv",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "@veyora/api",
    env: env.NODE_ENV,
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});
