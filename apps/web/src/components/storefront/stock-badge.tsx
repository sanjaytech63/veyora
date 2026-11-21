"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StockBadgeProps {
  stock: number;
  trackQuantity?: boolean;
  className?: string;
  showTextDetail?: boolean;
}

export function StockBadge({
  stock,
  trackQuantity = true,
  className,
  showTextDetail = true,
}: StockBadgeProps) {
  if (!trackQuantity) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium tracking-tight text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
          className
        )}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <span>In Stock</span>
      </div>
    );
  }

  if (stock <= 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium tracking-tight text-muted-foreground",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        <span>Out of Stock</span>
      </div>
    );
  }

  if (stock <= 5) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium tracking-tight text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300",
          className
        )}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
        <span className="tabular-nums">
          {showTextDetail ? `Only ${stock} units left — order soon` : `${stock} Left`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium tracking-tight text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="tabular-nums">
        {showTextDetail ? "In Stock — Dispatches Tomorrow" : "In Stock"}
      </span>
    </div>
  );
}
