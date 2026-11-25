"use client";

import { normalizeApiError, NormalizedApiError } from "@veyora/utils";
import { toast } from "@/components/ui/sonner";
import { getApiSuccessMetadata } from "@/lib/api/api-client";

const recentNotifications = new Map<string, number>();

function notificationId(normalized: NormalizedApiError): string {
  return `${normalized.code}:${normalized.requestId ?? ""}:${normalized.message}`;
}

export function notifyApiError(error: unknown, fallbackMessage?: string): NormalizedApiError {
  const normalized = normalizeApiError(error, fallbackMessage);
  if (
    normalized.code === "CLIENT_ABORTED" ||
    normalized.code === "CANCELLED" ||
    normalized.code === "ABORTED"
  ) {
    return normalized;
  }
  const id = notificationId(normalized);
  const now = Date.now();
  const previous = recentNotifications.get(id);
  if (previous && now - previous < 1500) return normalized;

  recentNotifications.set(id, now);
  toast.error(normalized.message, {
    id,
    description: normalized.requestId ? `Request ID: ${normalized.requestId}` : undefined,
  });
  return normalized;
}

export function notifyApiSuccess(result: unknown): boolean {
  const metadata = getApiSuccessMetadata(result);
  const envelope =
    typeof result === "object" && result !== null ? (result as Record<string, unknown>) : undefined;
  const message =
    metadata?.message || (typeof envelope?.message === "string" ? envelope.message : undefined);
  if (!message) return false;
  toast.success(message, { id: `success:${message}` });
  return true;
}

export function notifyWarning(message: string, description?: string): void {
  toast.warning(message, { id: `warning:${message}`, description });
}

export function notifyInfo(message: string, description?: string): void {
  toast.info(message, { id: `info:${message}`, description });
}
