/**
 * Validates that a redirect destination is a safe local relative path.
 * Protects against Open Redirect vulnerabilities (e.g. //attacker.com, /\\attacker.com, javascript:).
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback = "/"): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();

  // Must begin with a single forward slash and not contain protocols or double slashes
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("://") ||
    trimmed.includes("\r") ||
    trimmed.includes("\n") ||
    trimmed.includes("\0")
  ) {
    return fallback;
  }

  // Prevent backslash evasion e.g. /\%2f or /\
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith("//") || decoded.startsWith("/\\") || decoded.includes("://")) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}
