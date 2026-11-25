import { Request, Response, NextFunction } from "express";
import { isAppError, ValidationError, isSafeUserFacingMessage } from "@veyora/utils";
import { ApiErrorResponse, ApiErrorDetail } from "@veyora/types";
import { logger } from "../config/logger";
import { ZodError } from "zod";

/**
 * Centralized global error handling middleware for Express API.
 * Normalizes all operational, validation, database, and unexpected server errors
 * into the canonical ApiErrorResponse contract while preserving backward compatibility.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected internal server error occurred. Please try again later.";
  let details: ApiErrorDetail[] | undefined = undefined;
  let errors: Record<string, string[]> | undefined = undefined;

  // 1. AppError and derived domain errors
  if (isAppError(err)) {
    statusCode = err.statusCode;
    code = err.code;
    details = err.details;

    if (err instanceof ValidationError && err.errors) {
      errors = err.errors;
      if (!details || details.length === 0) {
        details = [];
        for (const [field, msgs] of Object.entries(err.errors)) {
          for (const msg of msgs) {
            details.push({
              field,
              code: "VALIDATION_ERROR",
              message: isSafeUserFacingMessage(msg) ? msg : "Invalid value provided.",
            });
          }
        }
      }
    }

    if (!err.isOperational || statusCode >= 500) {
      message = "An unexpected internal server error occurred. Please try again later.";
    } else if (isSafeUserFacingMessage(err.message)) {
      message = err.message;
    } else {
      message = "An error occurred while processing your request.";
    }
  }
  // 2. Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    message = "Please review the submitted information.";

    details = err.errors.map((e) => ({
      field: e.path.join(".") || undefined,
      code: e.code,
      message: isSafeUserFacingMessage(e.message) ? e.message : "Invalid value provided.",
    }));

    errors = {};
    for (const e of err.errors) {
      const field = e.path.join(".") || "form";
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(e.message);
    }
  }
  // 3. MongoDB duplicate key errors (E11000)
  else if (
    (err as unknown as { code?: number }).code === 11000 ||
    err.name === "MongoServerError" ||
    err.message.includes("E11000 duplicate key")
  ) {
    statusCode = 409;
    code = "CONFLICT";
    message = "A resource with the specified identifier already exists.";

    const keyPattern = (err as unknown as { keyPattern?: Record<string, number> }).keyPattern;
    const dupField = keyPattern ? Object.keys(keyPattern)[0] : "identifier";
    details = [
      {
        field: dupField,
        code: "duplicate",
        message: "Value already in use.",
      },
    ];
  }
  // 4. Mongoose CastError (invalid ObjectId or type casting failure)
  else if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = "Invalid identifier format provided.";

    const path = (err as unknown as { path?: string }).path || "id";
    details = [
      {
        field: path,
        code: "invalid_format",
        message: "Invalid format.",
      },
    ];
  }
  // 5. Malformed JSON payload
  else if (
    err.name === "SyntaxError" &&
    "status" in err &&
    (err as { status?: number }).status === 400
  ) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Malformed JSON payload provided.";
  }
  // 6. JWT token expiration or signature errors
  else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "SESSION_EXPIRED";
    message = "Session expired. Please log in again.";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "UNAUTHORIZED";
    message = "Invalid authentication token provided.";
  }

  // Resolve request correlation ID
  const rawReqId =
    req.id || req.requestId || res.getHeader("X-Request-Id") || res.getHeader("x-request-id");
  const reqId: string = rawReqId ? String(rawReqId) : "unknown";

  // Log error using Pino with correlation ID
  const logMethod = statusCode >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
  logMethod(
    {
      requestId: reqId,
      path: req.originalUrl,
      method: req.method,
      statusCode,
      code,
      stack: statusCode >= 500 ? err.stack : undefined,
    },
    message
  );

  // Construct canonical response with backward-compatibility layer
  const errorResponse: ApiErrorResponse & {
    error?: { code: string; message: string; details?: ApiErrorDetail[] };
    errors?: Record<string, string[]>;
  } = {
    success: false,
    code,
    message,
    ...(details && details.length > 0 ? { details } : {}),
    meta: {
      requestId: reqId,
      timestamp: new Date().toISOString(),
    },
    // Backward compatibility for existing tests and legacy consumers
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
    ...(errors && Object.keys(errors).length > 0 ? { errors } : {}),
  };

  res.status(statusCode).json(errorResponse);
}
