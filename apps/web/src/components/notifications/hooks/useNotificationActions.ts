"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api/notification-api";
import { notificationKeys } from "@/lib/api/query-keys";
import { toast } from "sonner";

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.setQueryData(notificationKeys.detail(updated.id), updated);
    },
    onError: () => {
      toast.error("Failed to update notification state");
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsUnread(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.setQueryData(notificationKeys.detail(updated.id), updated);
      toast.success("Marked as unread");
    },
    onError: () => {
      toast.error("Failed to update notification state");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success("All notices marked as read");
    },
    onError: () => {
      toast.error("Failed to mark notices as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success("Notice dismissed");
    },
    onError: () => {
      toast.error("Failed to delete notification");
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
