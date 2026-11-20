/**
 * Standard structured logger for Veyora
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  tag: string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

class Logger {
  private format(
    level: LogLevel,
    tag: string,
    message: string,
    meta?: Record<string, unknown>
  ): string {
    const payload: LogPayload = {
      level,
      tag,
      message,
      timestamp: new Date().toISOString(),
      ...(meta ? { meta } : {}),
    };
    return JSON.stringify(payload);
  }

  public debug(tag: string, message: string, meta?: Record<string, unknown>): void {
    if (process.env["NODE_ENV"] !== "production") {
      console.debug(this.format("debug", tag, message, meta));
    }
  }

  public info(tag: string, message: string, meta?: Record<string, unknown>): void {
    console.info(this.format("info", tag, message, meta));
  }

  public warn(tag: string, message: string, meta?: Record<string, unknown>): void {
    console.warn(this.format("warn", tag, message, meta));
  }

  public error(tag: string, message: string, meta?: Record<string, unknown>): void {
    console.error(this.format("error", tag, message, meta));
  }
}

export const logger = new Logger();
