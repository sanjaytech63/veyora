"use client";

import { normalizeApiError, NormalizedApiError } from "@veyora/utils";
import { toast } from "@/components/ui/sonner";

const recentNotifications = new Map<string, number>();

function notificationId(normalized: NormalizedApiError): string {
  return `${normalized.code}:${normalized.requestId ?? ""}:${normalized.message}`;
}

export function notifyApiError(error: unknown, fallbackMessage?: string): NormalizedApiError {
  const normalized = normalizeApiError(error, fallbackMessage);
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

export function notifySuccess(message: string, description?: string): void {
  toast.success(message, { id: `success:${message}:${description ?? ""}`, description });
}

export function notifyWarning(message: string, description?: string): void {
  toast.warning(message, { id: `warning:${message}`, description });
}

export function notifyInfo(message: string, description?: string): void {
  toast.info(message, { id: `info:${message}`, description });
}
