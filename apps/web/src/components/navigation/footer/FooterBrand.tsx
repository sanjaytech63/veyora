"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { SERVICES } from "@veyora/config";
import { cn } from "@/lib/utils";

export function FooterBrand({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <Link
        href="/"
        aria-label={`${SERVICES.NAME} Atelier Home`}
        className="flex items-center gap-2.5 font-bold text-lg tracking-tight group"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:bg-primary/90 transition-colors">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-extrabold tracking-tight text-foreground">{SERVICES.NAME}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Fashion Atelier
          </span>
        </div>
      </Link>

      <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
        Contemporary Indian couture and modern ready-to-wear. Handcrafted from authentic Chanderi
        silks, pure mulmul cotton, and heritage Banarasi brocades.
      </p>

      <div className="text-[11px] text-muted-foreground/80 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Concierge &amp; Worldwide Express Fulfillment Active</span>
      </div>
    </div>
  );
}
