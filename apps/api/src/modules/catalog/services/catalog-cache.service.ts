import { RedisService } from "../../../database/redis";
import { logger } from "../../../config/logger";
import { env } from "../../../config/env";

export class CatalogCacheService {
  private static readonly PREFIX = "veyora:cache:";
  private static readonly DEFAULT_TTL = 120; // 2 minutes

  /**
   * Safe getter for Redis client
   */
  private getClient() {
    try {
      if (env.NODE_ENV === "test") return null;
      return RedisService.getClient();
    } catch {
      return null;
    }
  }

  /**
   * Retrieve cached data by key
   */
  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client || !RedisService.connected) return null;

    try {
      const fullKey = `${CatalogCacheService.PREFIX}${key}`;
      const raw = await client.get(fullKey);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err: unknown) {
      logger.debug({ err, key }, "Cache get failed gracefully");
      return null;
    }
  }

  /**
   * Cache arbitrary data with TTL
   */
  async set(key: string, data: unknown, ttlSeconds = CatalogCacheService.DEFAULT_TTL): Promise<void> {
    const client = this.getClient();
    if (!client || !RedisService.connected) return;

    try {
      const fullKey = `${CatalogCacheService.PREFIX}${key}`;
      const serialized = JSON.stringify(data);
      await client.set(fullKey, serialized, "EX", ttlSeconds);
    } catch (err: unknown) {
      logger.debug({ err, key }, "Cache set failed gracefully");
    }
  }

  /**
   * Invalidate all keys matching a specific pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const client = this.getClient();
    if (!client || !RedisService.connected) return;

    try {
      const fullPattern = `${CatalogCacheService.PREFIX}${pattern}`;
      const keys = await client.keys(fullPattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err: unknown) {
      logger.debug({ err, pattern }, "Cache pattern invalidation failed gracefully");
    }
  }

  /**
   * Invalidate all search and catalog cache entries
   */
  async invalidateCatalogCache(): Promise<void> {
    await Promise.all([
      this.invalidatePattern("search:*"),
      this.invalidatePattern("catalog:*"),
      this.invalidatePattern("suggestions:*"),
    ]);
  }
}

export const catalogCacheService = new CatalogCacheService();
