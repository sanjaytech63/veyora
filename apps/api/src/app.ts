import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { requestId } from "./middleware/request-id";
import { requestLogger } from "./middleware/request-logger";
import { apiRateLimiter } from "./middleware/rate-limiter";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { healthRouter } from "./modules/health/health.router";
import { systemRouter } from "./modules/system/system.router";
import { authRouter } from "./modules/auth/auth.router";
import { openApiSpec } from "./docs/openapi";

export function createApp(): Application {
  const app = express();

  // 1. Trust proxy in production if behind reverse proxy
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // 2. Request Identification & Tracking
  app.use(requestId);

  // 3. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    })
  );

  // 4. CORS Whitelist
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    })
  );

  // 5. Cookie Parsing with secret
  app.use(cookieParser(env.COOKIE_SECRET));

  // 6. Request Body Parsers with configurable size limits
  app.use(express.json({ limit: env.BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));

  // 7. Structured Pino Request Logging
  if (env.NODE_ENV !== "test") {
    app.use(requestLogger);
  }

  // 8. Top-level Liveness/Readiness Health Probes (no rate limit for orchestrator probes)
  app.use("/health", healthRouter);

  // 9. OpenAPI Documentation UI
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // 10. Rate Limiting for API routes
  app.use(env.API_PREFIX, apiRateLimiter);

  // 11. API V1 Routes
  const apiV1Router = express.Router();
  apiV1Router.use("/health", healthRouter);
  apiV1Router.use("/system", systemRouter);
  apiV1Router.use("/auth", authRouter);

  app.use(env.API_PREFIX, apiV1Router);

  // 12. 404 & Centralized Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
