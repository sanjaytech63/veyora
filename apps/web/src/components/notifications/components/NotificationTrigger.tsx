"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { NotificationBadge } from "./NotificationBadge";
import { cn } from "@/lib/utils";

interface NotificationTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  unreadCount?: number;
  className?: string;
}

export const NotificationTrigger = React.forwardRef<HTMLButtonElement, NotificationTriggerProps>(
  ({ unreadCount = 0, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Open notifications (${unreadCount} unread)`}
        className={cn(
          "relative rounded-full hover:bg-accent/60 h-9 w-9 text-muted-foreground hover:text-foreground transition-colors",
          className
        )}
        {...props}
      >
        <Bell className="h-4 w-4" />
        <NotificationBadge count={unreadCount} variant="floating" />
      </Button>
    );
  }
);

NotificationTrigger.displayName = "NotificationTrigger";
