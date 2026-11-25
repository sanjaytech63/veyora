/**
 * Safe Error Presentation Utility for Admin App Router Boundaries
 *
 * Enforces production-safe error categorization, prevents information leakage
 * (stack traces, database strings, auth tokens, internal endpoints), and provides
 * actionable administrative guidance for auth, permission, network, and unexpected failures.
 */

export interface SafeAdminErrorInfo {
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

export function parseSafeAdminError(
  error: unknown,
  isProduction: boolean = process.env.NODE_ENV === "production"
): SafeAdminErrorInfo {
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
      title: "Administrative Session Expired",
      message:
        "Your console session has expired or requires authentication. Please sign in again to continue managing the atelier.",
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
      title: "Insufficient Administrative Privileges",
      message:
        "Your account lacks the required permissions for this action. Contact a Superadmin if you require elevated access.",
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
      title: "Backend API Connection Interrupted",
      message:
        "Unable to establish communication with the administration API service. Please verify your connection or retry shortly.",
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
      title: "Administrative Entity Not Located",
      message:
        "The requested product, customer record, or administrative resource does not exist or may have been archived.",
      errorType: "notFound",
      isAuthError: false,
      isForbidden: false,
      isNetworkError: false,
    };
  }

  // 5. Sensitive data check or production default
  if (isProduction || containsSensitiveData(rawMessage)) {
    return {
      title: "Administration Console Fault",
      message:
        "An unexpected error occurred during administrative console execution. You may retry the action or return to the executive dashboard.",
      errorType: "server",
      isAuthError: false,
      isForbidden: false,
      isNetworkError: false,
    };
  }

  // 6. Safe development fallback
  return {
    title: "Administration Console Interrupted",
    message: rawMessage,
    errorType: "unknown",
    isAuthError: false,
    isForbidden: false,
    isNetworkError: false,
  };
}
