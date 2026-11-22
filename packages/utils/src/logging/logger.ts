import { LogLevel, LogContext, StructuredLogPayload } from "./logger.types";
import { redactSensitiveData } from "./logger.redaction";
import { getLoggerConfig, shouldLog } from "./logger.config";

export class Logger {
  private bindings: LogContext;

  constructor(bindings: LogContext = {}) {
    this.bindings = bindings;
  }

  public child(bindings: LogContext): Logger {
    return new Logger({ ...this.bindings, ...bindings });
  }

  private resolveArgs(
    arg1: string | LogContext,
    arg2?: string,
    arg3?: LogContext
  ): { tag: string; message: string; meta?: Record<string, unknown> } {
    if (typeof arg1 === "object" && arg1 !== null) {
      const tagVal = typeof arg1["tag"] === "string" ? arg1["tag"] : undefined;
      const eventVal = typeof arg1["event"] === "string" ? arg1["event"] : undefined;
      const msgVal = typeof arg1["message"] === "string" ? arg1["message"] : undefined;
      const combinedTag = tagVal || eventVal || "SYSTEM";
      const combinedMsg = msgVal || eventVal || "Log event";
      const rest = { ...arg1 };
      delete rest["tag"];
      delete rest["event"];
      delete rest["message"];
      return {
        tag: combinedTag,
        message: combinedMsg,
        meta: Object.keys(rest).length > 0 ? (rest as Record<string, unknown>) : undefined,
      };
    }

    const tag = typeof arg1 === "string" ? arg1 : "SYSTEM";
    const message = arg2 || "";
    const meta = arg3 ? (arg3 as Record<string, unknown>) : undefined;
    return { tag, message, meta };
  }

  private write(
    level: LogLevel,
    arg1: string | LogContext,
    arg2?: string,
    arg3?: LogContext
  ): void {
    const config = getLoggerConfig();
    if (!shouldLog(level, config.minLevel)) {
      return;
    }

    const { tag, message, meta } = this.resolveArgs(arg1, arg2, arg3);
    const mergedMeta = { ...this.bindings, ...(meta || {}) };
    const sanitizedMeta =
      Object.keys(mergedMeta).length > 0
        ? (redactSensitiveData(mergedMeta) as Record<string, unknown>)
        : undefined;

    const payload: StructuredLogPayload = {
      level,
      tag,
      message,
      timestamp: new Date().toISOString(),
      ...(sanitizedMeta ? { meta: sanitizedMeta } : {}),
    };

    const output = JSON.stringify(payload);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "debug":
        console.debug(output);
        break;
      case "info":
      default:
        console.info(output);
        break;
    }
  }

  public debug(tag: string, message: string, meta?: LogContext): void;
  public debug(context: LogContext & { message?: string }): void;
  public debug(arg1: string | LogContext, arg2?: string, arg3?: LogContext): void {
    this.write("debug", arg1, arg2, arg3);
  }

  public info(tag: string, message: string, meta?: LogContext): void;
  public info(context: LogContext & { message?: string }): void;
  public info(arg1: string | LogContext, arg2?: string, arg3?: LogContext): void {
    this.write("info", arg1, arg2, arg3);
  }

  public warn(tag: string, message: string, meta?: LogContext): void;
  public warn(context: LogContext & { message?: string }): void;
  public warn(arg1: string | LogContext, arg2?: string, arg3?: LogContext): void {
    this.write("warn", arg1, arg2, arg3);
  }

  public error(tag: string, message: string, meta?: LogContext): void;
  public error(context: LogContext & { message?: string }): void;
  public error(arg1: string | LogContext, arg2?: string, arg3?: LogContext): void {
    this.write("error", arg1, arg2, arg3);
  }
}

export const logger = new Logger();
