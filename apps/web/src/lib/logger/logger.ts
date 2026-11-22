import { BrowserLogContext, ErrorReportHandler } from "./logger.types";

const SENSITIVE_KEY_PATTERNS = [
  /passw(or)?d/i,
  /secret/i,
  /token/i,
  /otp/i,
  /auth(orization)?/i,
  /credit[-_]?card/i,
  /cvv/i,
  /pin/i,
];

function sanitizeBrowserContext(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeBrowserContext);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeBrowserContext(val);
    }
  }
  return sanitized;
}

class BrowserLogger {
  private isProduction = process.env.NODE_ENV === "production";
  private errorReporter?: ErrorReportHandler;

  public setErrorReporter(reporter: ErrorReportHandler): void {
    this.errorReporter = reporter;
  }

  public debug(message: string, context?: BrowserLogContext): void {
    if (this.isProduction) return;
    const clean = context ? sanitizeBrowserContext(context) : undefined;
    console.debug(`[DEBUG] ${message}`, clean ?? "");
  }

  public info(message: string, context?: BrowserLogContext): void {
    if (this.isProduction) return;
    const clean = context ? sanitizeBrowserContext(context) : undefined;
    console.info(`[INFO] ${message}`, clean ?? "");
  }

  public warn(message: string, context?: BrowserLogContext): void {
    const clean = context ? sanitizeBrowserContext(context) : undefined;
    console.warn(`[WARN] ${message}`, clean ?? "");
  }

  public error(message: string, context?: BrowserLogContext): void {
    const clean = context ? sanitizeBrowserContext(context) : undefined;
    console.error(`[ERROR] ${message}`, clean ?? "");

    if (this.errorReporter && context?.error) {
      try {
        this.errorReporter(context.error, clean as BrowserLogContext);
      } catch {
        // Prevent reporter error from breaking execution
      }
    }
  }
}

export const logger = new BrowserLogger();
