import {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponseError,
  ApiErrorDetail,
  ApiCoreCode,
} from "@veyora/types";

/**
 * Normalized API error representation guaranteed to be safe for user display
 * and deterministic programmatic branching.
 */
export interface NormalizedApiError {
  code: string;
  message: string;
  details: ApiErrorDetail[];
  requestId?: string;
  statusCode?: number;
}

export interface NormalizedApiSuccess<T = unknown> {
  success: true;
  code?: string;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export function normalizeApiSuccess<T = unknown>(
  value: unknown,
  fallbackData?: T
): NormalizedApiSuccess<T> {
  if (typeof value === "object" && value !== null) {
    const candidate = value as Record<string, unknown>;
    if (candidate.success === true && "data" in candidate) {
      return {
        success: true,
        code: typeof candidate.code === "string" ? candidate.code : undefined,
        message:
          typeof candidate.message === "string" && isSafeUserFacingMessage(candidate.message)
            ? candidate.message
            : undefined,
        data: candidate.data as T,
        meta:
          typeof candidate.meta === "object" && candidate.meta !== null
            ? (candidate.meta as Record<string, unknown>)
            : undefined,
      };
    }
  }
  return { success: true, data: (fallbackData ?? value) as T };
}

/**
 * Patterns representing raw server, database, infrastructure, or internal exceptions
 * and leaked credentials that MUST NEVER be exposed to end users.
 */
const UNSAFE_MESSAGE_PATTERNS = [
  /mongo/i,
  /mongoose/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /cast\s+to\s+/i,
  /duplicate\s+key/i,
  /syntaxerror/i,
  /referenceerror/i,
  /typeerror/i,
  /rangeerror/i,
  /evalerror/i,
  /at\s+[a-zA-Z0-9_$.]+\s+\(/i, // Stack trace line
  /at\s+[a-zA-Z0-9_$.]+:[0-9]+:[0-9]+/i, // Stack trace line
  /[a-zA-Z]:\\[^ \n]+/i, // Windows file path
  /\/(var|usr|etc|home|app|node_modules)\/[^ \n]+/i, // Unix file path
  /password\s*[:=]\s*['"]?[^\s'"]+/i, // Leaked password value
  /authorization\s*:\s*bearer/i,
  /bearer\s+[a-zA-Z0-9._-]{10,}/i, // Leaked JWT/bearer token
  /token\s*[:=]\s*['"]?[^\s'"]+/i, // Leaked token value
  /otp\s*[:=]\s*['"]?[0-9]+/i, // Leaked OTP value
  /cookie\s*[:=]\s*['"]?[^\s'"]+/i, // Leaked cookie value
  /set-cookie/i,
];

/**
 * Tests whether an error message string is safe to display to end users.
 */
export function isSafeUserFacingMessage(message: unknown): message is string {
  if (typeof message !== "string" || message.trim().length === 0) {
    return false;
  }
  const clean = message.trim();
  // Too long or contains internal crash patterns
  if (clean.length > 500) {
    return false;
  }
  return !UNSAFE_MESSAGE_PATTERNS.some((pattern) => pattern.test(clean));
}

/**
 * Type guard for canonical ApiSuccessResponse envelope
 */
export function isApiSuccessResponse<T = unknown>(value: unknown): value is ApiSuccessResponse<T> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.success === true &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    "data" in candidate
  );
}

/**
 * Type guard for canonical ApiErrorResponse envelope
 */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.success === false &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}

/**
 * Type guard for legacy ApiResponseError envelope
 */
export function isLegacyApiResponseError(value: unknown): value is ApiResponseError {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.success === false && (candidate.error !== undefined || candidate.errors !== undefined)
  );
}

/**
 * Extract request ID from various error envelope formats
 */
export function extractRequestId(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  const candidate = error as Record<string, unknown>;

  if (candidate.response && typeof candidate.response === "object") {
    const response = candidate.response as Record<string, unknown>;
    const headers = response.headers;
    if (typeof headers === "object" && headers !== null) {
      const headerMap = headers as Record<string, unknown>;
      const headerRequestId =
        headerMap["x-request-id"] ??
        (typeof headerMap.get === "function"
          ? (headerMap.get as (name: string) => unknown)("x-request-id")
          : undefined);
      if (typeof headerRequestId === "string") return headerRequestId;
    }
  }

  // Canonical meta.requestId
  if (
    candidate.meta &&
    typeof candidate.meta === "object" &&
    typeof (candidate.meta as Record<string, unknown>).requestId === "string"
  ) {
    return (candidate.meta as Record<string, unknown>).requestId as string;
  }

  // Top-level requestId
  if (typeof candidate.requestId === "string" && candidate.requestId.length > 0) {
    return candidate.requestId;
  }

  // Nested response.data.meta.requestId (Axios/Fetch error shapes)
  if (candidate.response && typeof candidate.response === "object") {
    const res = candidate.response as Record<string, unknown>;
    if (res.data && typeof res.data === "object") {
      const data = res.data as Record<string, unknown>;
      if (data.meta && typeof data.meta === "object") {
        const meta = data.meta as Record<string, unknown>;
        if (typeof meta.requestId === "string") {
          return meta.requestId;
        }
      }
    }
  }

  return undefined;
}

/**
 * Extract validation details from canonical or legacy error envelopes
 */
export function extractErrorDetails(error: unknown): ApiErrorDetail[] {
  if (typeof error !== "object" || error === null) {
    return [];
  }
  const candidate = error as Record<string, unknown>;

  if (candidate.response && typeof candidate.response === "object") {
    const responseData = (candidate.response as Record<string, unknown>).data;
    if (typeof responseData === "object" && responseData !== null) {
      const dataDetails = extractErrorDetails(responseData);
      if (dataDetails.length > 0) return dataDetails;
    }
  }

  // 1. Canonical details array: { details: ApiErrorDetail[] }
  if (Array.isArray(candidate.details)) {
    return (candidate.details as unknown[])
      .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null)
      .map((d) => ({
        field: typeof d.field === "string" ? d.field : undefined,
        code: typeof d.code === "string" ? d.code : undefined,
        message: isSafeUserFacingMessage(d.message)
          ? (d.message as string)
          : "Invalid value provided",
      }));
  }

  // 2. Legacy nested error.details: { error: { details: ApiErrorDetail[] } }
  if (
    candidate.error &&
    typeof candidate.error === "object" &&
    Array.isArray((candidate.error as Record<string, unknown>).details)
  ) {
    const details = (candidate.error as Record<string, unknown>).details as unknown[];
    return details
      .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null)
      .map((d) => ({
        field: typeof d.field === "string" ? d.field : undefined,
        code: typeof d.code === "string" ? d.code : undefined,
        message: isSafeUserFacingMessage(d.message)
          ? (d.message as string)
          : "Invalid value provided",
      }));
  }

  // 3. Legacy errors dictionary: { errors: Record<string, string[]> }
  if (
    candidate.errors &&
    typeof candidate.errors === "object" &&
    !Array.isArray(candidate.errors)
  ) {
    const fieldMap = candidate.errors as Record<string, unknown>;
    const details: ApiErrorDetail[] = [];
    for (const [field, msgs] of Object.entries(fieldMap)) {
      if (Array.isArray(msgs)) {
        for (const msg of msgs) {
          if (typeof msg === "string") {
            details.push({
              field,
              code: "VALIDATION_ERROR",
              message: isSafeUserFacingMessage(msg) ? msg : "Invalid value provided",
            });
          }
        }
      }
    }
    if (details.length > 0) {
      return details;
    }
  }

  return [];
}

/**
 * Extract stable machine-readable error code from unknown error
 */
export function extractErrorCode(
  error: unknown,
  defaultCode = ApiCoreCode.INTERNAL_SERVER_ERROR
): string {
  // Check Network / Abort errors on Error instances first
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "TIMEOUT";
    }
    const errText = error.message ? error.message.toLowerCase() : "";
    if (error.name === "TypeError" && (errText.includes("fetch") || errText.includes("network"))) {
      return "NETWORK_ERROR";
    }
  }

  if (typeof error !== "object" || error === null) {
    return defaultCode;
  }
  const candidate = error as Record<string, unknown>;

  if (candidate.response && typeof candidate.response === "object") {
    const response = candidate.response as Record<string, unknown>;
    if (typeof response.status === "number") {
      const mapped = extractErrorCode({ statusCode: response.status });
      if (typeof response.data === "object" && response.data !== null) {
        const data = response.data as Record<string, unknown>;
        if (typeof data.code === "string") return data.code;
        if (
          typeof data.error === "object" &&
          data.error !== null &&
          typeof (data.error as Record<string, unknown>).code === "string"
        ) {
          return (data.error as Record<string, unknown>).code as string;
        }
      }
      return mapped;
    }
  }

  // Top-level code
  if (typeof candidate.code === "string" && candidate.code.length > 0) {
    return candidate.code;
  }

  // Legacy nested error.code
  if (
    candidate.error &&
    typeof candidate.error === "object" &&
    typeof (candidate.error as Record<string, unknown>).code === "string"
  ) {
    return (candidate.error as Record<string, unknown>).code as string;
  }

  // Check HTTP statusCode mapping if available
  if (typeof candidate.statusCode === "number") {
    switch (candidate.statusCode) {
      case 400:
        return ApiCoreCode.BAD_REQUEST;
      case 401:
        return ApiCoreCode.UNAUTHORIZED;
      case 403:
        return ApiCoreCode.FORBIDDEN;
      case 404:
        return ApiCoreCode.RESOURCE_NOT_FOUND;
      case 409:
        return ApiCoreCode.CONFLICT;
      case 422:
        return ApiCoreCode.VALIDATION_ERROR;
      case 429:
        return ApiCoreCode.RATE_LIMIT_EXCEEDED;
      case 408:
      case 504:
        return "TIMEOUT";
      default:
        if (candidate.statusCode >= 500) {
          return ApiCoreCode.INTERNAL_SERVER_ERROR;
        }
    }
  }

  return defaultCode;
}

/**
 * Extract safe user-facing error message
 */
export function extractErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred."
): string {
  if (typeof error === "string") {
    return isSafeUserFacingMessage(error) ? error : fallbackMessage;
  }

  // Check standard Error instances for Network / Abort conditions
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Request timed out. Please try again.";
    }
    const errText = error.message ? error.message.toLowerCase() : "";
    if (error.name === "TypeError" && (errText.includes("fetch") || errText.includes("network"))) {
      return "Unable to connect to the server. Please check your network connection.";
    }
  }

  if (typeof error !== "object" || error === null) {
    return fallbackMessage;
  }

  const candidate = error as Record<string, unknown>;

  if (candidate.response && typeof candidate.response === "object") {
    const response = candidate.response as Record<string, unknown>;
    if (typeof response.data === "object" && response.data !== null) {
      const responseMessage = extractErrorMessage(response.data, fallbackMessage);
      if (responseMessage !== fallbackMessage) return responseMessage;
    }
  }

  // 1. Canonical top-level message
  const topMessage = candidate.message;
  if (typeof topMessage === "string" && isSafeUserFacingMessage(topMessage)) {
    // If statusCode is 500 or isOperational is explicitly false, do not trust arbitrary message
    if (
      candidate.statusCode &&
      typeof candidate.statusCode === "number" &&
      candidate.statusCode >= 500
    ) {
      return fallbackMessage;
    }
    if (candidate.isOperational === false) {
      return fallbackMessage;
    }
    return topMessage;
  }

  // 2. Legacy nested error.message
  if (candidate.error && typeof candidate.error === "object") {
    const nestedMsg = (candidate.error as Record<string, unknown>).message;
    if (typeof nestedMsg === "string" && isSafeUserFacingMessage(nestedMsg)) {
      return nestedMsg;
    }
  }

  return fallbackMessage;
}

/**
 * Normalizes any unknown error into a strongly typed, sanitized NormalizedApiError.
 *
 * Guarantees:
 * - Never leaks stack traces, database internals, or raw infrastructure errors.
 * - Supports canonical and legacy error envelopes.
 * - Extracts request IDs when available for support correlation.
 * - Maps network and timeout failures deterministically.
 */
export function normalizeApiError(
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again."
): NormalizedApiError {
  const code = extractErrorCode(error);
  const message = extractErrorMessage(error, fallbackMessage);
  const details = extractErrorDetails(error);
  const requestId = extractRequestId(error);

  let statusCode: number | undefined = undefined;
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const codeNum = (error as Record<string, unknown>).statusCode;
    if (typeof codeNum === "number") {
      statusCode = codeNum;
    }
  }
  if (
    statusCode === undefined &&
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as Record<string, unknown>).response;
    if (typeof response === "object" && response !== null) {
      const responseStatus = (response as Record<string, unknown>).status;
      if (typeof responseStatus === "number") statusCode = responseStatus;
    }
  }

  return {
    code,
    message,
    details,
    requestId,
    ...(statusCode !== undefined ? { statusCode } : {}),
  };
}
