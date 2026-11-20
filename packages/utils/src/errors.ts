import { ApiErrorDetail } from "@veyora/types";

/**
 * Standard Application Error Classes
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: ApiErrorDetail[];

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: ApiErrorDetail[],
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
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

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: ApiErrorDetail[]) {
    super(message, 422, "VALIDATION_ERROR", details);
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
