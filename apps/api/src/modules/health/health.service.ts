import { MongoDatabase } from "../../database/mongodb";
import { RedisService } from "../../database/redis";
import { env } from "../../config/env";
import { HealthCheckResponse } from "@veyora/types";

export interface ReadinessResponse {
  status: "ready" | "not_ready";
  timestamp: string;
  checks: {
    mongodb: {
      status: "connected" | "disconnected";
      latencyMs?: number;
    };
    redis: {
      status: "connected" | "disconnected";
      latencyMs?: number;
    };
  };
}

export class HealthService {
  public static getBasicHealth(): HealthCheckResponse {
    const mem = process.memoryUsage();
    return {
      status: "ok",
      service: "@veyora/api",
      environment: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      },
    };
  }

  public static async getReadiness(): Promise<{ isReady: boolean; details: ReadinessResponse }> {
    const [mongoHealth, redisHealth] = await Promise.all([
      MongoDatabase.checkHealth(),
      RedisService.checkHealth(),
    ]);

    const isReady = mongoHealth.connected && redisHealth.connected;

    return {
      isReady,
      details: {
        status: isReady ? "ready" : "not_ready",
        timestamp: new Date().toISOString(),
        checks: {
          mongodb: {
            status: mongoHealth.connected ? "connected" : "disconnected",
            latencyMs: mongoHealth.latencyMs,
          },
          redis: {
            status: redisHealth.connected ? "connected" : "disconnected",
            latencyMs: redisHealth.latencyMs,
          },
        },
      },
    };
  }
}
