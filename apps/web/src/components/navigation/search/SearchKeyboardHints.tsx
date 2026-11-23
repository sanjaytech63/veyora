import * as React from "react";
import { cn } from "@/lib/utils";

export function SearchKeyboardHints({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "hidden sm:flex items-center justify-between px-4 py-2.5 border-t border-border/40 bg-muted/20 text-[11px] text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="inline-flex h-4 items-center rounded bg-muted px-1.5 font-mono text-[10px] font-medium border border-border/50">
            ↑
          </kbd>
          <kbd className="inline-flex h-4 items-center rounded bg-muted px-1.5 font-mono text-[10px] font-medium border border-border/50">
            ↓
          </kbd>
          <span className="ml-1">to navigate</span>
        </span>

        <span className="flex items-center gap-1">
          <kbd className="inline-flex h-4 items-center rounded bg-muted px-1.5 font-mono text-[10px] font-medium border border-border/50">
            ↵
          </kbd>
          <span className="ml-1">to select</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <kbd className="inline-flex h-4 items-center rounded bg-muted px-1.5 font-mono text-[10px] font-medium border border-border/50">
          esc
        </kbd>
        <span className="ml-1">to close</span>
      </div>
    </div>
  );
}
