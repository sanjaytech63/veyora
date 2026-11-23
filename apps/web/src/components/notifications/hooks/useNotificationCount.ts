"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api/notification-api";
import { notificationKeys } from "@/lib/api/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export function useNotificationCount() {
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 1000 * 15,
  });

  return {
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    refetch,
  };
}
