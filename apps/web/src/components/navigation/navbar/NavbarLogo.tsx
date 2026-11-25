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
        "group flex items-center gap-2.5 rounded-md font-bold text-lg tracking-tight outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        className
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 group-hover:scale-[0.96]">
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
