import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../config/logger";

/**
 * Strict regex for validating incoming request IDs.
 * Allows alphanumeric characters, underscores, hyphens, dots, and colons up to 64 chars.
 * Rejects overly long strings, whitespace, newlines, control characters, or injection attempts.
 */
const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9_\-.:]{1,64}$/;

/**
 * Validates incoming request ID or generates a cryptographically secure UUID.
 * Binds the verified ID to req.id, req.requestId, req.log, and the X-Request-Id response header.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers["x-request-id"];
  let id: string;

  if (typeof incoming === "string" && SAFE_REQUEST_ID_REGEX.test(incoming.trim())) {
    id = incoming.trim();
  } else {
    id = crypto.randomUUID();
  }

  req.id = id;
  req.requestId = id;
  req.log = logger.child({ requestId: id });

  res.setHeader("X-Request-Id", id);

  next();
}
