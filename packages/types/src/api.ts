import { AppEnvironment } from "./common";

/**
 * Standard API Response structures for Veyora services
 */

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  timestamp: string;
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  service: string;
  environment: AppEnvironment;
  uptime: number;
  timestamp: string;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  dependencies?: {
    redis?: "connected" | "disconnected" | "not_checked";
    mongodb?: "connected" | "disconnected" | "not_checked";
  };
}

export interface SystemInfoResponse {
  service: string;
  version: string;
  environment: AppEnvironment;
  nodeVersion: string;
  platform: string;
  timestamp: string;
}
