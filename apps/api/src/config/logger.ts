import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "password",
      "token",
      "secret",
      "refreshToken",
      "accessToken",
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
