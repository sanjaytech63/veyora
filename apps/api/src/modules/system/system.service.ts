import { SystemInfoResponse } from "@veyora/types";
import { SERVICES } from "@veyora/config";
import { env } from "../../config/env";

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
}
