import { HealthCheckResponse } from "@veyora/types";
import { env } from "../../config/env";

export class HealthService {
  public static getHealth(): HealthCheckResponse {
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
}
