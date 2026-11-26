import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { MongoDatabase } from "./database/mongodb";
import { RedisService } from "./database/redis";
import { socketServer } from "./infrastructure/socket/socket-server";
import { queueRegistry } from "./infrastructure/queues/queue-registry";

async function startServer(): Promise<void> {
  // 1. Initialize databases asynchronously
  try {
    await Promise.all([MongoDatabase.connect(), RedisService.connect()]);
  } catch (err) {
    logger.warn(
      { error: (err as Error).message },
      "Initial database connection warning - continuing server startup"
    );
  }

  // 2. Create Express app and HTTP server
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO server
  socketServer.init(server);

  server.listen(env.PORT, "0.0.0.0", () => {
    logger.info(
      {
        port: env.PORT,
        host: "0.0.0.0",
        env: env.NODE_ENV,
        prefix: env.API_PREFIX,
        docs: `http://localhost:${env.PORT}/docs`,
      },
      `Veyora API server listening on 0.0.0.0:${env.PORT}`
    );
  });

  // 3. Graceful shutdown handler
  let isShuttingDown = false;

  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ signal }, `Received ${signal}. Draining connections and shutting down...`);

    // Force close after timeout
    const forceExitTimeout = setTimeout(() => {
      logger.error("Forced termination due to shutdown timeout");
      process.exit(1);
    }, 10000);

    try {
      // Close Socket.IO & background queues
      await socketServer.close();
      await queueRegistry.closeAll();

      // Close HTTP server
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info("HTTP server closed to new requests");

      // Disconnect DBs
      await Promise.all([MongoDatabase.disconnect(), RedisService.disconnect()]);

      clearTimeout(forceExitTimeout);
      logger.info("Graceful shutdown completed successfully");
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimeout);
      logger.error({ error: (error as Error).message }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}

startServer().catch((error) => {
  logger.fatal({ error: (error as Error).message }, "Failed to start Veyora API");
  process.exit(1);
});
