import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers["x-request-id"];
  const id = typeof existingId === "string" && existingId.trim() ? existingId : crypto.randomUUID();

  req.id = id;
  res.setHeader("X-Request-Id", id);

  next();
}
