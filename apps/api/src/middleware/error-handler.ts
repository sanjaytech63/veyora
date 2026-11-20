import { Request, Response, NextFunction } from "express";
import { AppError, isAppError, logger } from "@veyora/utils";
import { ApiResponseError } from "@veyora/types";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isExpected = isAppError(err);
  const statusCode = isExpected ? err.statusCode : 500;
  const errorCode = isExpected ? err.code : "INTERNAL_SERVER_ERROR";
  const errorMessage = isExpected ? err.message : "An unexpected server error occurred";

  logger.error("ERROR_HANDLER", `[${errorCode}] ${req.method} ${req.url} - ${errorMessage}`, {
    stack: err.stack,
    details: isExpected ? err.details : undefined,
  });

  const response: ApiResponseError = {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      details: isExpected ? err.details : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}
