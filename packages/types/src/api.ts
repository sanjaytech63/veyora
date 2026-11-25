import { AppEnvironment } from "./common";

/**
 * Standard pagination metadata envelope for collection queries
 */
export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Standard API metadata envelope for diagnostics, tracing, and pagination
 */
export interface ApiMeta {
  requestId?: string;
  timestamp?: string;
  pagination?: ApiPaginationMeta;
  [key: string]: unknown;
}

/**
 * Canonical success response contract across Veyora monorepo.
 * All successful Express controller mutations and queries adhere to this envelope.
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  code: string;
  message: string;
  data: T;
  meta?: ApiMeta;
}

/**
 * Field-level validation and domain error representation
 */
export interface ApiErrorDetail {
  field?: string;
  code?: string;
  message: string;
}

/**
 * Canonical error response contract across Veyora monorepo.
 * All error responses from Express error handlers and middleware adhere to this envelope.
 */
export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  meta?: ApiMeta;
}

/**
 * Shared paginated collection response envelope
 */
export interface ApiPaginatedResponse<T = unknown> extends ApiSuccessResponse<T[]> {
  meta: ApiMeta & {
    pagination: ApiPaginationMeta;
  };
}

/**
 * Legacy API Success Response interface retained for backwards compatibility
 * during phased migration.
 */
export interface ApiResponseSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp?: string;
  message?: string;
  code?: string;
}

/**
 * Legacy API Error Response interface retained for backwards compatibility
 * during phased migration.
 */
export interface ApiResponseError {
  success: false;
  message?: string;
  code?: string;
  error?: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  errors?: Record<string, string[]>;
  details?: ApiErrorDetail[];
  timestamp?: string;
  meta?: ApiMeta;
}

/**
 * Universal API response union covering both canonical contracts and legacy responses.
 */
export type ApiResponse<T = unknown> =
  ApiSuccessResponse<T> | ApiErrorResponse | ApiResponseSuccess<T> | ApiResponseError;

/**
 * Standard Next.js Server Action Result shape across Web and Admin
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  timestamp?: string;
}

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
