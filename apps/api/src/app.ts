import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { healthRouter } from "./modules/health/health.router";
import { systemRouter } from "./modules/system/system.router";

export function createApp(): Application {
  const app = express();

  // Security and utilities middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Top-level liveness/readiness health check (outside API prefix for orchestrators)
  app.use("/health", healthRouter);

  // API router with prefix
  const apiRouter = express.Router();
  apiRouter.use("/health", healthRouter);
  apiRouter.use("/system", systemRouter);

  app.use(env.API_PREFIX, apiRouter);

  // 404 & Centralized Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
