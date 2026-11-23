"use client";

import * as React from "react";
import Link from "next/link";
import { NotificationListItemProps } from "../types/notification.types";
import {
  getNotificationStyle,
  formatNotificationTime,
  resolveNotificationTargetUrl,
} from "../utils/notification-formatters";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationListItem({
  notification,
  onSelect,
  onMarkRead,
  onMarkUnread,
  onDelete,
  className,
}: NotificationListItemProps) {
  const style = getNotificationStyle(notification.type);
  const Icon = style.icon;
  const timeFormatted = formatNotificationTime(notification.createdAt);
  const targetUrl = resolveNotificationTargetUrl(notification);

  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    onSelect?.(notification);
  };

  return (
    <div
      role="article"
      onClick={handleClick}
      className={cn(
        "group relative p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-muted/40",
        !notification.isRead ? "bg-primary/5" : "bg-card/40",
        className
      )}
    >
      {/* Notification Icon */}
      <div
        className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border border-border/40 transition-transform group-hover:scale-105",
          style.iconBgClass,
          style.iconColorClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1 text-xs min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1 py-0 h-3.5 font-semibold uppercase tracking-wider",
                style.badgeClass
              )}
            >
              {style.badgeLabel}
            </Badge>
            <p
              className={cn(
                "truncate",
                !notification.isRead
                  ? "font-bold text-foreground"
                  : "font-medium text-muted-foreground"
              )}
            >
              {notification.title}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
            {timeFormatted}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        <div className="flex items-center justify-between pt-1">
          <Link
            href={targetUrl}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="text-[11px] text-primary hover:underline font-semibold inline-flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRight className="h-3 w-3" />
          </Link>

          {/* Quick Item Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {!notification.isRead ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead?.(notification.id);
                }}
                title="Mark as read"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Mark notification as read"
              >
                <Check className="h-3 w-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkUnread?.(notification.id);
                }}
                title="Mark as unread"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Mark notification as unread"
              >
                <span className="h-2 w-2 rounded-full border border-current" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                title="Dismiss"
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Dismiss notification"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <span
          className="h-2 w-2 rounded-full bg-primary shrink-0 self-center"
          aria-label="Unread notification indicator"
        />
      )}
    </div>
  );
}
