import Redis, { RedisOptions } from "ioredis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

export function createRedisClient(customOptions?: Partial<RedisOptions>): Redis {
  let client: Redis;

  if (env.REDIS_URL) {
    client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null, // Required by BullMQ & Redis adapter
      enableReadyCheck: false,
      tls: env.REDIS_URL.startsWith("rediss://") || env.REDIS_TLS ? {} : undefined,
      retryStrategy(times) {
        if (env.NODE_ENV === "test") return null;
        return Math.min(times * 150, 3000);
      },
      ...customOptions,
    });
  } else {
    const options: RedisOptions = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: null, // Required by BullMQ & Redis adapter
      enableReadyCheck: false,
      tls: env.REDIS_TLS ? {} : undefined,
      retryStrategy(times) {
        if (env.NODE_ENV === "test") return null;
        const delay = Math.min(times * 150, 3000);
        return delay;
      },
      ...customOptions,
    };
    client = new Redis(options);
  }

  client.on("error", (err) => {
    // Only log warning if not in test
    if (env.NODE_ENV !== "test") {
      logger.warn({ error: err.message }, "Redis connection issue encountered");
    }
  });

  return client;
}
