import pinoHttp from "pino-http";
import { logger } from "../config/logger";
import { Request, Response } from "express";
import { redactSensitiveData } from "@veyora/utils";

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) =>
    (req as Request).id ||
    req.headers["x-request-id"] ||
    "req-" + Math.random().toString(36).substring(7),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res, responseTime) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  serializers: {
    req: (req: Request) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: redactSensitiveData(req.query),
      params: redactSensitiveData(req.params),
      remoteAddress: req.ip,
    }),
    res: (res: Response) => ({
      statusCode: res.statusCode,
    }),
  },
});
