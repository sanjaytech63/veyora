"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "./NotificationBadge";
import { CheckCheck, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllRead: () => void;
  isMarkingAllRead?: boolean;
  className?: string;
}

export function NotificationHeader({
  unreadCount,
  onMarkAllRead,
  isMarkingAllRead = false,
  className,
}: NotificationHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/20",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-foreground">Notifications</span>
        <NotificationBadge count={unreadCount} variant="inline" />
      </div>

      {unreadCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMarkAllRead}
          disabled={isMarkingAllRead}
          className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground gap-1 rounded-lg"
          aria-label="Mark all notifications as read"
        >
          {isMarkingAllRead ? (
            <LoaderCircle className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCheck className="h-3 w-3" />
          )}
          <span>Mark all read</span>
        </Button>
      )}
    </div>
  );
}
