"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api/notification-api";
import { notificationKeys } from "@/lib/api/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import {
  NotificationListQuery,
  NotificationDto,
  PaginatedNotificationsDto,
} from "../types/notification.types";

export function useNotifications(query?: NotificationListQuery, enabled = true) {
  const { isAuthenticated } = useAuthStore();

  const queryResult = useQuery<PaginatedNotificationsDto>({
    queryKey: notificationKeys.list(query as Record<string, unknown>),
    queryFn: () => notificationApi.listNotifications(query),
    enabled: isAuthenticated && enabled,
    staleTime: 1000 * 20,
  });

  const rawData = queryResult.data;

  // Defensive parsing guaranteeing array access
  const notifications: NotificationDto[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.items)
      ? rawData.items
      : [];

  const total = rawData?.total ?? notifications.length;
  const unreadCount = rawData?.unreadCount ?? notifications.filter((item) => !item.isRead).length;
  const page = rawData?.page ?? (Number(query?.page) || 1);
  const totalPages = rawData?.totalPages ?? 1;

  return {
    ...queryResult,
    notifications,
    total,
    unreadCount,
    page,
    totalPages,
  };
}
