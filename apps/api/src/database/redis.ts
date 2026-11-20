import Redis, { RedisOptions } from "ioredis";
import { env } from "../config/env";
import { logger } from "../config/logger";

interface RedisHealth {
  connected: boolean;
  status: string;
  latencyMs?: number;
}

export class RedisService {
  private static client: Redis | null = null;
  private static isConnected = false;

  public static get connected(): boolean {
    return RedisService.isConnected;
  }

  public static getClient(): Redis {
    if (!RedisService.client) {
      const options: RedisOptions = {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        connectTimeout: 5000,
        retryStrategy(times) {
          if (env.NODE_ENV === "test") return null;
          const delay = Math.min(times * 200, 3000);
          return delay;
        },
      };

      const redis = new Redis(options);

      redis.on("connect", () => {
        logger.info("Connecting to Redis...");
      });

      redis.on("ready", () => {
        RedisService.isConnected = true;
        logger.info("Redis client connected and ready");
      });

      redis.on("error", (err) => {
        RedisService.isConnected = false;
        logger.error({ error: err.message }, "Redis connection error");
      });

      redis.on("close", () => {
        RedisService.isConnected = false;
        logger.warn("Redis connection closed");
      });

      RedisService.client = redis;
    }

    return RedisService.client;
  }

  public static async connect(): Promise<void> {
    const client = RedisService.getClient();
    try {
      if (client.status === "wait" || client.status === "close") {
        await client.connect();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message }, "Failed to connect to Redis on initialization");
      if (env.NODE_ENV === "production") {
        throw error;
      }
    }
  }

  public static async checkHealth(): Promise<RedisHealth> {
    const client = RedisService.getClient();

    if (client.status !== "ready") {
      return {
        connected: false,
        status: client.status || "disconnected",
      };
    }

    try {
      const start = Date.now();
      const pong = await Promise.race([
        client.ping(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Redis ping timeout")), 1000)
        ),
      ]);
      const latencyMs = Date.now() - start;

      const isHealthy = pong === "PONG";
      return {
        connected: isHealthy,
        status: isHealthy ? "ready" : client.status,
        latencyMs: isHealthy ? latencyMs : undefined,
      };
    } catch {
      return {
        connected: false,
        status: client.status || "disconnected",
      };
    }
  }

  public static async disconnect(): Promise<void> {
    if (RedisService.client) {
      logger.info("Closing Redis connection...");
      try {
        await RedisService.client.quit();
      } catch {
        RedisService.client.disconnect();
      }
      RedisService.client = null;
      RedisService.isConnected = false;
      logger.info("Redis connection closed gracefully");
    }
  }
}
