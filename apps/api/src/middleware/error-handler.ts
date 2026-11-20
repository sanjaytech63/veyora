import { Request, Response, NextFunction } from "express";
import { isAppError } from "@veyora/utils";
import { ApiResponseError, ApiErrorDetail } from "@veyora/types";
import { logger } from "../config/logger";
import { ZodError } from "zod";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected internal server error occurred";
  let details: ApiErrorDetail[] | undefined = undefined;

  if (isAppError(err)) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    message = "Request validation failed";
    details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));
  } else if (err.name === "SyntaxError" && "status" in err && err.status === 400) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Malformed JSON payload provided";
  } else if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = "Invalid identifier format";
  }

  // Log error using Pino
  logger.error(
    {
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      statusCode,
      code,
      stack: statusCode >= 500 ? err.stack : undefined,
    },
    message
  );

  const errorResponse: ApiResponseError = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(errorResponse);
}
