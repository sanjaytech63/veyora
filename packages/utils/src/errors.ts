import { ApiErrorDetail } from "@veyora/types";

/**
 * Options for instantiating an AppError via object parameter
 */
export interface AppErrorOptions {
  message: string;
  statusCode?: number;
  code?: string;
  details?: ApiErrorDetail[];
  isOperational?: boolean;
  cause?: unknown;
}

/**
 * Standard Application Error Class across Veyora monorepo.
 * Supports both legacy positional parameters and modern options object.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: ApiErrorDetail[];
  public readonly cause?: unknown;

  constructor(
    messageOrOptions: string | AppErrorOptions,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: ApiErrorDetail[],
    isOperational = true
  ) {
    if (typeof messageOrOptions === "object" && messageOrOptions !== null) {
      super(messageOrOptions.message);
      this.statusCode = messageOrOptions.statusCode ?? 500;
      this.code = messageOrOptions.code ?? "INTERNAL_SERVER_ERROR";
      this.details = messageOrOptions.details;
      this.isOperational = messageOrOptions.isOperational ?? true;
      this.cause = messageOrOptions.cause;
    } else {
      super(messageOrOptions);
      this.statusCode = statusCode;
      this.code = code;
      this.details = details;
      this.isOperational = isOperational;
    }
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: ApiErrorDetail[]) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: ApiErrorDetail[]) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: ApiErrorDetail[]) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: ApiErrorDetail[]) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: ApiErrorDetail[]) {
    super(message, 409, "CONFLICT", details);
  }
}

export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(
    message = "Validation failed",
    details?: ApiErrorDetail[],
    errors?: Record<string, string[]>
  ) {
    super(message, 422, "VALIDATION_ERROR", details);
    this.errors = errors;
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, "INTERNAL_SERVER_ERROR", undefined, false);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
