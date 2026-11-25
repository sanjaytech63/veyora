"use client";

import * as React from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function AnnouncementBar({ className }: { className?: string }) {
  const { announcementDismissed, dismissAnnouncement } = useUIStore();

  if (announcementDismissed) return null;

  return (
    <div
      className={cn(
        "relative isolate flex items-center justify-between gap-x-6 overflow-hidden bg-primary px-4 py-2 sm:px-6 transition-all duration-300",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center justify-center gap-x-2 text-[10px] font-medium text-primary-foreground sm:text-[11px]">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" />
        <span>
          {" "}
          <span>Free shipping on orders over ₹999</span>
          <span className="hidden text-primary-foreground/80 sm:inline">•</span>
          <span className="hidden sm:inline">Get 10% off on your first order</span>
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={dismissAnnouncement}
        className="-m-1.5 h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 focus:outline-none"
        aria-label="Dismiss announcement banner"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
