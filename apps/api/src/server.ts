import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "@veyora/utils";
import http from "http";

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info("API_SERVER", `Veyora API running on port ${env.PORT} in ${env.NODE_ENV} mode`, {
    port: env.PORT,
    prefix: env.API_PREFIX,
    env: env.NODE_ENV,
  });
});

function handleShutdown(signal: string): void {
  logger.info("API_SERVER", `Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info("API_SERVER", "HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("API_SERVER", "Forceful shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
