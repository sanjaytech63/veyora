export type LogLevel = "debug" | "info" | "warn" | "error";

export interface BrowserLogContext extends Record<string, unknown> {
  event?: string;
  source?: string;
  userId?: string;
  path?: string;
  action?: string;
  error?: unknown;
}

export type ErrorReportHandler = (error: unknown, context?: BrowserLogContext) => void;
