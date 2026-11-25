"use server";

import { serverFetch, ServerApiClientError } from "@/lib/api/server-api-client";
import { markNotificationReadSchema } from "@veyora/validators";
import type { ActionResult } from "@veyora/types";

/**
 * Server Action: Mark Single Notification as Read
 */
export async function markNotificationReadAction(
  notificationId: string,
  auth?: { token?: string }
): Promise<ActionResult<{ notificationId: string }>> {
  const validation = markNotificationReadSchema.safeParse({ notificationId });
  if (!validation.success) {
    return {
      success: false,
      error: "Invalid notification identifier.",
      code: "VALIDATION_ERROR",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    await serverFetch<void>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      token: auth?.token,
      requireAuth: true,
    });

    return {
      success: true,
      data: { notificationId },
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    if (error instanceof ServerApiClientError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: false,
      error: "Failed to mark notification as read.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Server Action: Mark All Customer Notifications as Read
 */
export async function markAllNotificationsReadAction(auth?: {
  token?: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    await serverFetch<void>("/notifications/read-all", {
      method: "PATCH",
      token: auth?.token,
      requireAuth: true,
    });

    return {
      success: true,
      data: { success: true },
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    if (error instanceof ServerApiClientError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: false,
      error: "Failed to mark all notifications as read.",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    };
  }
}
