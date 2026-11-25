"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { SERVICES } from "@veyora/config";
import { cn } from "@/lib/utils";
import { FooterSocialLinks } from "./FooterSocialLinks";

export function FooterBrand({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <Link
        href="/"
        aria-label={`${SERVICES.NAME} Atelier Home`}
        className="flex items-center gap-2.5 font-bold text-lg tracking-tight group"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-150 group-hover:bg-primary/90">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-extrabold tracking-tight text-foreground">{SERVICES.NAME}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Fashion Atelier
          </span>
        </div>
      </Link>

      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        Contemporary Indian fashion and modern ready-to-wear, bringing considered silhouettes and
        timeless style together.
      </p>

      <div className="space-y-2.5">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Follow Veyora
        </span>
        <FooterSocialLinks />
      </div>
    </div>
  );
}
