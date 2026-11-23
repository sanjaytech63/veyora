"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationTrigger } from "./NotificationTrigger";
import { NotificationHeader } from "./NotificationHeader";
import { NotificationList } from "./NotificationList";
import { NotificationLoadingState } from "./NotificationLoadingState";
import { NotificationEmptyState } from "./NotificationEmptyState";
import { NotificationErrorState } from "./NotificationErrorState";
import { NotificationFooter } from "./NotificationFooter";
import { useNotificationCount } from "../hooks/useNotificationCount";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationActions } from "../hooks/useNotificationActions";
import { useAuthStore } from "@/stores/auth-store";
import { NotificationDto, NotificationPopoverProps } from "../types/notification.types";
import { resolveNotificationTargetUrl } from "../utils/notification-formatters";
import { cn } from "@/lib/utils";

export function NotificationPopover({ align = "end", className }: NotificationPopoverProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = React.useState(false);

  const { unreadCount, refetch: refetchCount } = useNotificationCount();
  const {
    notifications,
    isLoading,
    isError,
    refetch: refetchList,
  } = useNotifications({ limit: 8 }, open);

  const { markAsRead, markAsUnread, markAllAsRead, deleteNotification, isMarkingAllRead } =
    useNotificationActions();

  if (!isAuthenticated) return null;

  const handleSelectNotification = (notif: NotificationDto) => {
    setOpen(false);
    const targetUrl = resolveNotificationTargetUrl(notif);
    router.push(targetUrl);
  };

  const handleRetry = () => {
    refetchCount();
    refetchList();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <NotificationTrigger unreadCount={unreadCount} className={className} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className={cn(
          "w-80 sm:w-96 rounded-2xl p-0 shadow-2xl border-border/80 bg-popover text-popover-foreground flex flex-col overflow-hidden max-h-[85vh]",
          className
        )}
      >
        {/* Header */}
        <NotificationHeader
          unreadCount={unreadCount}
          onMarkAllRead={() => markAllAsRead()}
          isMarkingAllRead={isMarkingAllRead}
        />

        {/* Content Body */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <NotificationLoadingState count={4} />
          ) : isError ? (
            <NotificationErrorState onRetry={handleRetry} />
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <NotificationList
              notifications={notifications}
              onSelect={handleSelectNotification}
              onMarkRead={markAsRead}
              onMarkUnread={markAsUnread}
              onDelete={deleteNotification}
            />
          )}
        </div>

        {/* Footer */}
        <NotificationFooter onClose={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
