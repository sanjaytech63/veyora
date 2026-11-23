import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  variant?: "floating" | "inline";
  className?: string;
}

export function NotificationBadge({
  count,
  variant = "floating",
  className,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? "99+" : count > 9 ? "9+" : count;

  if (variant === "inline") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] font-bold px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 tabular-nums",
          className
        )}
      >
        {count} new
      </Badge>
    );
  }

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums animate-in zoom-in-50",
        className
      )}
      aria-label={`${count} unread notifications`}
    >
      {displayCount}
    </span>
  );
}
