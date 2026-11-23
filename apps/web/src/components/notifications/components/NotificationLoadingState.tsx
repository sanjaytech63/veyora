import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function NotificationLoadingState({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("divide-y divide-border/40", className)}
      role="status"
      aria-label="Loading notices"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-3.5 flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-3/5 rounded-md" />
              <Skeleton className="h-3 w-10 rounded-md" />
            </div>
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-4/5 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
