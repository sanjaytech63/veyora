"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Audio", href: "/category/audio" },
  { label: "Workspace", href: "/category/workspace" },
  { label: "Collections", href: "/#collections" },
];

export function StoreNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("hidden md:flex items-center gap-7", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === "/shop" && pathname === "/products");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary tracking-tight",
              isActive ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
