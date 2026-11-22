import { SystemInfoResponse } from "@veyora/types";
import { SERVICES } from "@veyora/config";
import { env } from "../../config/env";
import { MongoDatabase } from "../../database/mongodb";
import { RedisService } from "../../database/redis";

export class SystemService {
  public static getSystemInfo(): SystemInfoResponse {
    return {
      service: "@veyora/api",
      version: SERVICES.VERSION,
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generates standard Prometheus text exposition format metrics
   * for process telemetry, heap memory, CPU, and database health.
   */
  public static async getPrometheusMetrics(): Promise<string> {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const uptime = process.uptime();

    let mongoConnected = false;
    let redisConnected = false;

    try {
      const [mongoHealth, redisHealth] = await Promise.all([
        MongoDatabase.checkHealth().catch(() => ({ connected: false })),
        RedisService.checkHealth().catch(() => ({ connected: false })),
      ]);
      mongoConnected = Boolean(mongoHealth.connected);
      redisConnected = Boolean(redisHealth.connected);
    } catch {
      // Fallback in test/isolated environments
    }

    const lines: string[] = [
      "# HELP process_uptime_seconds The uptime of the Node.js process in seconds.",
      "# TYPE process_uptime_seconds gauge",
      `process_uptime_seconds ${uptime.toFixed(2)}`,
      "",
      "# HELP process_heap_bytes Process heap memory usage in bytes.",
      "# TYPE process_heap_bytes gauge",
      `process_heap_bytes{type="used"} ${mem.heapUsed}`,
      `process_heap_bytes{type="total"} ${mem.heapTotal}`,
      `process_heap_bytes{type="rss"} ${mem.rss}`,
      "",
      "# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.",
      "# TYPE process_cpu_seconds_total counter",
      `process_cpu_seconds_total{type="user"} ${(cpu.user / 1e6).toFixed(4)}`,
      `process_cpu_seconds_total{type="system"} ${(cpu.system / 1e6).toFixed(4)}`,
      "",
      "# HELP veyora_database_connected Database connection status (1 for connected, 0 for disconnected).",
      "# TYPE veyora_database_connected gauge",
      `veyora_database_connected{database="mongodb"} ${mongoConnected ? 1 : 0}`,
      `veyora_database_connected{database="redis"} ${redisConnected ? 1 : 0}`,
      "",
      "# HELP veyora_build_info Information about the Veyora build and runtime environment.",
      "# TYPE veyora_build_info gauge",
      `veyora_build_info{version="${SERVICES.VERSION}",node_version="${process.version}",environment="${env.NODE_ENV}"} 1`,
      "",
    ];

    return lines.join("\n");
  }
}
