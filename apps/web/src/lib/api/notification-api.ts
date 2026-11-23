/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./api-client";
import {
  NotificationDto,
  NotificationListQuery,
  PaginatedNotificationsDto,
  UnreadCountDto,
} from "@veyora/types";

export const notificationApi = {
  listNotifications: async (query?: NotificationListQuery): Promise<PaginatedNotificationsDto> => {
    try {
      const response = await apiClient.request<any>("/notifications", {
        method: "GET",
        raw: true,
        params: query as Record<string, string | number | boolean | undefined | null>,
      });

      const rawItems: NotificationDto[] = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.items)
          ? response.data.items
          : [];

      const pagination = response?.pagination || response?.meta || {};
      const total = Number(pagination.total) || rawItems.length;
      const unreadCount =
        typeof pagination.unreadCount === "number"
          ? pagination.unreadCount
          : rawItems.filter((n) => !n.isRead).length;
      const page = Number(pagination.page) || Number(query?.page) || 1;
      const limit = Number(pagination.limit) || Number(query?.limit) || 20;
      const totalPages = Number(pagination.totalPages) || Math.max(1, Math.ceil(total / limit));

      return {
        items: rawItems,
        total,
        unreadCount,
        page,
        limit,
        totalPages,
      };
    } catch {
      return {
        items: [],
        total: 0,
        unreadCount: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    }
  },

  getUnreadCount: (): Promise<UnreadCountDto> =>
    apiClient.get<UnreadCountDto>("/notifications/unread-count"),

  getNotification: (id: string): Promise<NotificationDto> =>
    apiClient.get<NotificationDto>(`/notifications/${id}`),

  markAsRead: (id: string): Promise<NotificationDto> =>
    apiClient.patch<NotificationDto>(`/notifications/${id}/read`, {}),

  markAsUnread: (id: string): Promise<NotificationDto> =>
    apiClient.patch<NotificationDto>(`/notifications/${id}/unread`, {}),

  markAllAsRead: (): Promise<{ success: boolean; count: number }> =>
    apiClient.patch<{ success: boolean; count: number }>("/notifications/read-all", {}),

  deleteNotification: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete<{ success: boolean }>(`/notifications/${id}`),
};
