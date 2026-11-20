"use client";

import * as React from "react";
import { X, Sparkles } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function AnnouncementBar() {
  const { announcementDismissed, dismissAnnouncement } = useUIStore();

  if (announcementDismissed) return null;

  return (
    <div className="relative isolate flex items-center justify-between gap-x-6 overflow-hidden bg-primary px-4 py-2 sm:px-6">
      <div className="flex flex-1 items-center justify-center gap-x-2 text-xs font-medium text-primary-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span>Veyora Platform Phase B UI Foundation Live</span>
      </div>
      <button
        type="button"
        onClick={dismissAnnouncement}
        className="-m-1.5 p-1.5 text-primary-foreground/80 hover:text-primary-foreground focus:outline-none"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
