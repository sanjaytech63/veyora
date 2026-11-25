import { Response, Request } from "express";
import { ApiSuccessResponse, ApiMeta, ApiPaginationMeta } from "@veyora/types";

/**
 * Options for sending a canonical ApiSuccessResponse via options object
 */
export interface SendSuccessOptions<T = unknown> {
  statusCode?: number;
  code: string;
  message: string;
  data: T;
  meta?: Partial<ApiMeta> & {
    pagination?: ApiPaginationMeta;
    [key: string]: unknown;
  };
  extra?: Record<string, unknown>;
}

/**
 * Sends a canonical, strongly typed success response from an Express controller.
 *
 * Supports both options object and positional parameter signatures.
 * Automatically resolves and injects request ID and timestamp metadata.
 */
export function sendSuccess<T = unknown>(res: Response, options: SendSuccessOptions<T>): Response;
export function sendSuccess<T = unknown>(
  res: Response,
  data: T,
  message: string,
  code: string,
  meta?: Partial<ApiMeta>,
  statusCode?: number
): Response;
export function sendSuccess<T = unknown>(
  res: Response,
  optionsOrData: SendSuccessOptions<T> | T,
  message?: string,
  code?: string,
  meta?: Partial<ApiMeta>,
  statusCode?: number
): Response {
  // Signature 1: options object
  if (
    optionsOrData !== null &&
    typeof optionsOrData === "object" &&
    "code" in (optionsOrData as Record<string, unknown>) &&
    "message" in (optionsOrData as Record<string, unknown>) &&
    "data" in (optionsOrData as Record<string, unknown>)
  ) {
    const opts = optionsOrData as SendSuccessOptions<T>;
    const status = opts.statusCode ?? 200;
    const req = res.req as Request | undefined;
    const rawReqId =
      opts.meta?.requestId ||
      req?.id ||
      req?.requestId ||
      res.getHeader("X-Request-Id") ||
      res.getHeader("x-request-id");
    const reqId: string = rawReqId ? String(rawReqId) : "unknown";
    const timestamp = opts.meta?.timestamp || new Date().toISOString();

    const responsePayload: ApiSuccessResponse<T> & Record<string, unknown> = {
      success: true,
      code: opts.code,
      message: opts.message,
      data: opts.data,
      meta: {
        requestId: reqId,
        timestamp,
        ...(opts.meta?.pagination ? { pagination: opts.meta.pagination } : {}),
        ...opts.meta,
      },
      ...(opts.extra ? opts.extra : {}),
    };

    return res.status(status).json(responsePayload);
  }

  // Signature 2: positional parameters
  const data = optionsOrData as T;
  const status = statusCode ?? 200;
  const resolvedCode = code || "SUCCESS";
  const resolvedMessage = message || "Operation completed successfully.";
  const req = res.req as Request | undefined;
  const rawReqId =
    meta?.requestId ||
    req?.id ||
    req?.requestId ||
    res.getHeader("X-Request-Id") ||
    res.getHeader("x-request-id");
  const reqId: string = rawReqId ? String(rawReqId) : "unknown";
  const timestamp = meta?.timestamp || new Date().toISOString();

  const responsePayload: ApiSuccessResponse<T> = {
    success: true,
    code: resolvedCode,
    message: resolvedMessage,
    data,
    meta: {
      requestId: reqId,
      timestamp,
      ...(meta?.pagination ? { pagination: meta.pagination } : {}),
      ...meta,
    },
  };

  return res.status(status).json(responsePayload);
}
