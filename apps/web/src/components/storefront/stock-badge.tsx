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
      <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400", className)}>
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span>In Stock</span>
      </div>
    );
  }

  if (stock <= 0) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400", className)}>
        <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
        <span>Out of Stock</span>
      </div>
    );
  }

  if (stock <= 5) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400", className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <span>{showTextDetail ? `Only ${stock} units left — order soon` : "Low Stock"}</span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400", className)}>
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span>{showTextDetail ? "In Stock — Dispatches Tomorrow" : "In Stock"}</span>
    </div>
  );
}
