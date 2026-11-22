export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext extends Record<string, unknown> {
  event?: string;
  tag?: string;
  userId?: string;
  orderId?: string;
  queue?: string;
  jobId?: string;
  attempt?: number;
  durationMs?: number;
  statusCode?: number;
  method?: string;
  path?: string;
  requestId?: string;
  error?: unknown;
}

export interface StructuredLogPayload {
  level: LogLevel;
  tag: string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}
