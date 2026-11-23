"use client";

import { NavbarLinks, NavbarCategoryMenu } from "@/components/navigation/navbar";
import { cn } from "@/lib/utils";

export function StoreNav({ className }: { className?: string }) {
  return (
    <nav className={cn("hidden lg:flex items-center gap-1", className)}>
      <NavbarLinks />
      <NavbarCategoryMenu />
    </nav>
  );
}
