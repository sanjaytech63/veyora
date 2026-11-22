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
import { catalogRouter } from "./modules/catalog/catalog.router";
import { inventoryRouter } from "./modules/inventory/inventory.router";
import { cartRouter } from "./modules/cart/cart.router";
import { wishlistRouter } from "./modules/wishlist/wishlist.router";
import { addressRouter } from "./modules/checkout/address.router";
import { checkoutRouter } from "./modules/checkout/checkout.router";
import { paymentRouter } from "./modules/payment/payment.router";
import { couponRouter } from "./modules/coupon/coupon.router";
import { customerRouter } from "./modules/customer/customer.router";
import { reviewRouter } from "./modules/review/review.router";
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
  const configuredOrigins =
    env.CORS_ORIGIN === "*"
      ? ["*"]
      : env.CORS_ORIGIN.split(",").map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) {
          return callback(null, true);
        }
        if (configuredOrigins.includes("*") || configuredOrigins.includes(origin)) {
          return callback(null, true);
        }
        // In development, automatically allow any port on localhost or 127.0.0.1
        if (env.NODE_ENV !== "production") {
          const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
          if (isLocalhost) {
            return callback(null, true);
          }
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        "X-Guest-Id",
        "x-guest-id",
        "Accept",
        "Origin",
        "X-Requested-With",
      ],
      exposedHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
    })
  );

  // 5. Cookie Parsing with secret
  app.use(cookieParser(env.COOKIE_SECRET));

  // 6. Request Body Parsers with configurable size limits
  app.use(
    express.json({
      limit: env.BODY_LIMIT,
      verify: (req: express.Request & { rawBody?: string }, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    })
  );
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
  apiV1Router.use("/", catalogRouter);
  apiV1Router.use("/", inventoryRouter);
  apiV1Router.use("/", cartRouter);
  apiV1Router.use("/", wishlistRouter);
  apiV1Router.use("/", addressRouter);
  apiV1Router.use("/", checkoutRouter);
  apiV1Router.use("/", paymentRouter);
  apiV1Router.use("/", couponRouter);
  apiV1Router.use("/", customerRouter);
  apiV1Router.use("/", reviewRouter);

  app.use(env.API_PREFIX, apiV1Router);

  // 12. 404 & Centralized Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
