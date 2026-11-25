/**
 * Safe Error Presentation Utility for Web App Router Boundaries
 *
 * Enforces production-safe error categorization, prevents information leakage
 * (stack traces, database strings, auth tokens, internal endpoints), and provides
 * actionable user guidance for auth, permission, network, and unexpected failures.
 */

export interface SafeErrorInfo {
  title: string;
  message: string;
  errorType: "auth" | "forbidden" | "network" | "notFound" | "server" | "unknown";
  isAuthError: boolean;
  isForbidden: boolean;
  isNetworkError: boolean;
}

const SENSITIVE_PATTERNS = [
  /mongodb(\+srv)?:\/\/[^\s]+/i,
  /postgres(ql)?:\/\/[^\s]+/i,
  /mysql:\/\/[^\s]+/i,
  /redis:\/\/[^\s]+/i,
  /bearer\s+[a-z0-9._~+/-]+=*/i,
  /jwt\s+[a-z0-9._~+/-]+=*/i,
  /password\s*[:=]\s*[^\s]+/i,
  /secret\s*[:=]\s*[^\s]+/i,
  /api[_-]?key\s*[:=]\s*[^\s]+/i,
  /at\s+[a-z0-9_./\\-]+\.(js|ts|tsx):\d+:\d+/i,
  /select\s+.+\s+from\s+/i,
  /insert\s+into\s+/i,
  /mongo(error|servererror)/i,
  /econnrefused/i,
  /etimedout/i,
];

export function containsSensitiveData(message: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
}

export function parseSafeError(
  error: unknown,
  isProduction: boolean = process.env.NODE_ENV === "production"
): SafeErrorInfo {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred.";

  const lower = rawMessage.toLowerCase();

  // 1. Authentication / Session Expiration
  if (
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("session has expired") ||
    lower.includes("jwt expired") ||
    lower.includes("token expired") ||
    lower.includes("authentication token is required") ||
    lower.includes("authentication required")
  ) {
    return {
      title: "Session Expired",
      message:
        "Your atelier session has expired or requires authentication. Please sign in again to continue.",
      errorType: "auth",
      isAuthError: true,
      isForbidden: false,
      isNetworkError: false,
    };
  }

  // 2. Authorization / Permission Denied
  if (
    lower.includes("forbidden") ||
    lower.includes("403") ||
    lower.includes("access forbidden") ||
    lower.includes("permission denied") ||
    lower.includes("missing required permissions")
  ) {
    return {
      title: "Access Restricted",
      message: "You do not have permission to access this atelier resource or perform this action.",
      errorType: "forbidden",
      isAuthError: false,
      isForbidden: true,
      isNetworkError: false,
    };
  }

  // 3. Network / Timeout / Connectivity
  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("timeout") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("service unavailable") ||
    lower.includes("503")
  ) {
    return {
      title: "Connection Interrupted",
      message:
        "Unable to communicate with the atelier service. Please verify your internet connection and try again.",
      errorType: "network",
      isAuthError: false,
      isForbidden: false,
      isNetworkError: true,
    };
  }

  // 4. Resource Not Located (404)
  if (
    lower.includes("not found") ||
    lower.includes("404") ||
    lower.includes("resource not found")
  ) {
    return {
      title: "Resource Not Located",
      message:
        "The requested atelier garment, collection, or resource could not be found or has been archived.",
      errorType: "notFound",
      isAuthError: false,
      isForbidden: false,
      isNetworkError: false,
    };
  }

  // 5. Sensitive data check or production default
  if (isProduction || containsSensitiveData(rawMessage)) {
    return {
      title: "Something Went Wrong",
      message:
        "An unexpected error interrupted this storefront process. You may retry the action or return to the atelier homepage.",
      errorType: "server",
      isAuthError: false,
      isForbidden: false,
      isNetworkError: false,
    };
  }

  // 6. Safe development fallback
  return {
    title: "Something Went Wrong",
    message: rawMessage,
    errorType: "unknown",
    isAuthError: false,
    isForbidden: false,
    isNetworkError: false,
  };
}
