/**
 * Sensitive fields that must NEVER be leaked in log outputs
 */
const SENSITIVE_KEY_PATTERNS = [
  /passw(or)?d/i,
  /secret/i,
  /token/i,
  /otp/i,
  /auth(orization)?/i,
  /cookie/i,
  /credit[-_]?card/i,
  /card[-_]?number/i,
  /cvv/i,
  /cvc/i,
  /pan/i,
  /pin/i,
  /api[-_]?key/i,
  /private[-_]?key/i,
  /refresh[-_]?token/i,
  /access[-_]?token/i,
  /bearer/i,
];

export const REDACTED_MASK = "[REDACTED]";

/**
 * Deeply sanitizes payloads to strip secrets and confidential credentials
 */
export function redactSensitiveData(data: unknown, depth = 0, visited = new WeakSet()): unknown {
  if (depth > 6) return "[DEPTH_EXCEEDED]";
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env["NODE_ENV"] !== "production" ? data.stack : undefined,
    };
  }

  if (visited.has(data)) {
    return "[CIRCULAR]";
  }
  visited.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1, visited));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = REDACTED_MASK;
    } else {
      sanitized[key] = redactSensitiveData(val, depth + 1, visited);
    }
  }

  return sanitized;
}
