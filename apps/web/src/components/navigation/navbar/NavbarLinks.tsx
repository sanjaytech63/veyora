"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarLinksProps {
  className?: string;
  onNavigate?: () => void;
}

export function NavbarLinks({ className, onNavigate }: NavbarLinksProps) {
  const pathname = usePathname();

  const links = [
    { label: "Home", href: "/", isActive: pathname === "/" },
    { label: "Shop All", href: "/shop", isActive: pathname === "/shop" },
    {
      label: "New Arrivals",
      href: "/new-arrivals",
      isActive: pathname === "/new-arrivals",
      badge: "pulse",
    },
    {
      label: "Collections",
      href: "/collections",
      isActive: pathname.startsWith("/collections"),
    },
  ];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {links.map((link) => (
        <Button
          key={link.href}
          asChild
          variant="ghost"
          size="sm"
          className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase transition-colors"
        >
          <Link
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-1.5 transition-colors hover:text-primary",
              link.isActive ? "text-primary font-bold" : "text-muted-foreground"
            )}
          >
            <span>{link.label}</span>
            {link.badge === "pulse" && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
                aria-label="New arrivals drop available"
              />
            )}
          </Link>
        </Button>
      ))}
    </div>
  );
}
