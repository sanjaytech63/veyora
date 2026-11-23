import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SearchLoadingState({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-3 py-2", className)}
      aria-label="Loading catalog results"
      role="status"
    >
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-3 w-28 rounded-md" />
      </div>

      <div className="divide-y divide-border/40 rounded-xl overflow-hidden border border-border/40 bg-card/40">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3.5 p-2.5">
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
            <div className="space-y-1 w-14 shrink-0 text-right">
              <Skeleton className="h-4 w-full rounded-md ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
