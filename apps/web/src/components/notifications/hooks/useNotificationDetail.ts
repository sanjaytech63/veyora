"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api/notification-api";
import { notificationKeys } from "@/lib/api/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { NotificationDto } from "../types/notification.types";

export function useNotificationDetail(id: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<NotificationDto>({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationApi.getNotification(id),
    enabled: isAuthenticated && Boolean(id),
    staleTime: 1000 * 60,
  });
}
