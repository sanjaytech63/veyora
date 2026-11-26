import Redis, { RedisOptions } from "ioredis";
import { env } from "../config/env";
import { logger } from "@veyora/utils";

export function createRedisConnection(): Redis {
  let client: Redis;

  if (env.REDIS_URL) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: env.REDIS_URL.startsWith("rediss://") || env.REDIS_TLS ? {} : undefined,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        logger.warn("REDIS_CONNECTION", `Redis reconnect attempt ${times} in ${delay}ms`);
        return delay;
      },
    });
  } else {
    const redisOptions: RedisOptions = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: env.REDIS_TLS ? {} : undefined,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        logger.warn("REDIS_CONNECTION", `Redis reconnect attempt ${times} in ${delay}ms`);
        return delay;
      },
    };
    client = new Redis(redisOptions);
  }

  client.on("connect", () => {
    logger.info("REDIS_CONNECTION", "Connecting to Redis...");
  });

  client.on("ready", () => {
    logger.info("REDIS_CONNECTION", "Redis connection is ready");
  });

  client.on("error", (err) => {
    logger.error("REDIS_CONNECTION", "Redis error encountered", { error: err.message });
  });

  return client;
}

export const redisConnection = createRedisConnection();
