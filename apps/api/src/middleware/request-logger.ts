import { Request, Response, NextFunction } from "express";
import { logger } from "@veyora/utils";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    logger.info("HTTP_REQUEST", `${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
      method,
      url: originalUrl,
      statusCode,
      durationMs: duration,
      clientIp: ip,
    });
  });

  next();
}
