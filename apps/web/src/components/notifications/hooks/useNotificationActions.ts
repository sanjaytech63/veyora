"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api/notification-api";
import { notificationKeys } from "@/lib/api/query-keys";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.setQueryData(notificationKeys.detail(updated.id), updated);
    },
    onError: (error) => {
      notifyApiError(error);
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsUnread(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.setQueryData(notificationKeys.detail(updated.id), updated);
      notifyApiSuccess(updated);
    },
    onError: (error) => {
      notifyApiError(error);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      notifyApiSuccess(result);
    },
    onError: (error) => {
      notifyApiError(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      notifyApiSuccess(result);
    },
    onError: (error) => {
      notifyApiError(error);
    },
  });

  return {
    markAsRead: markReadMutation.mutate,
    markAsReadAsync: markReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,

    markAsUnread: markUnreadMutation.mutate,
    markAsUnreadAsync: markUnreadMutation.mutateAsync,
    isMarkingUnread: markUnreadMutation.isPending,

    markAllAsRead: markAllReadMutation.mutate,
    markAllAsReadAsync: markAllReadMutation.mutateAsync,
    isMarkingAllRead: markAllReadMutation.isPending,

    deleteNotification: deleteMutation.mutate,
    deleteNotificationAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
