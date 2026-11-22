import { apiClient } from "./api-client";
import {
  NotificationDto,
  NotificationListQuery,
  PaginatedNotificationsDto,
  UnreadCountDto,
} from "@veyora/types";

export const notificationApi = {
  listNotifications: (query?: NotificationListQuery): Promise<PaginatedNotificationsDto> =>
    apiClient.get<PaginatedNotificationsDto>("/notifications", {
      params: query as Record<string, string | number | boolean | undefined | null>,
    }),

  getUnreadCount: (): Promise<UnreadCountDto> =>
    apiClient.get<UnreadCountDto>("/notifications/unread-count"),

  markAsRead: (id: string): Promise<NotificationDto> =>
    apiClient.patch<NotificationDto>(`/notifications/${id}/read`, {}),

  markAllAsRead: (): Promise<{ success: boolean; count: number }> =>
    apiClient.patch<{ success: boolean; count: number }>("/notifications/read-all", {}),

  deleteNotification: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete<{ success: boolean }>(`/notifications/${id}`),
};
