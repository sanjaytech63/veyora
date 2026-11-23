"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { SERVICES } from "@veyora/config";
import { cn } from "@/lib/utils";

interface NavbarLogoProps {
  className?: string;
  onClick?: () => void;
}

export function NavbarLogo({ className, onClick }: NavbarLogoProps) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label={`${SERVICES.NAME} Atelier Home`}
      className={cn(
        "group flex items-center gap-2.5 font-bold text-lg tracking-tight transition-transform active:scale-98",
        className
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:bg-primary/90 transition-colors">
        <ShoppingBag className="h-4 w-4" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-extrabold tracking-tight text-foreground">{SERVICES.NAME}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Atelier
        </span>
      </div>
    </Link>
  );
}
