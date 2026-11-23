import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationEmptyStateProps {
  filter?: "all" | "unread" | "read";
  className?: string;
}

export function NotificationEmptyState({ filter = "all", className }: NotificationEmptyStateProps) {
  const message =
    filter === "unread"
      ? "You're all caught up! No unread notices."
      : "You will receive updates on your bespoke orders and concierge dispatches here.";

  return (
    <div className={cn("p-8 text-center space-y-2", className)} role="status">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/60 mx-auto">
        <Bell className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold text-foreground">
        {filter === "unread" ? "No unread notices" : "No notices right now"}
      </p>
      <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
        {message}
      </p>
    </div>
  );
}
