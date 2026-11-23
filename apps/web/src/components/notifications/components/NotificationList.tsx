"use client";

import * as React from "react";
import { NotificationDto } from "../types/notification.types";
import { NotificationListItem } from "./NotificationListItem";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  notifications: NotificationDto[];
  onSelect?: (notification: NotificationDto) => void;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function NotificationList({
  notifications,
  onSelect,
  onMarkRead,
  onMarkUnread,
  onDelete,
  className,
}: NotificationListProps) {
  if (notifications.length === 0) return null;

  return (
    <div
      role="feed"
      aria-label="Atelier notices list"
      className={cn(
        "divide-y divide-border/40 overflow-y-auto overscroll-contain max-h-[400px] sm:max-h-[440px] focus:outline-none",
        className
      )}
    >
      {notifications.map((notification) => (
        <NotificationListItem
          key={notification.id}
          notification={notification}
          onSelect={onSelect}
          onMarkRead={onMarkRead}
          onMarkUnread={onMarkUnread}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
