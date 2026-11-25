"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navbarLinks } from "./navbar.config";

interface NavbarLinksProps {
  className?: string;
  onNavigate?: () => void;
}

export function NavbarLinks({ className, onNavigate }: NavbarLinksProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {navbarLinks.map((link) => {
        const isActive =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex h-10 items-center rounded-md px-3 text-[11px] font-semibold uppercase tracking-[0.12em] outline-none",
              "transition-colors duration-200 hover:bg-accent/70 hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background",
              "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:bg-primary after:transition-transform after:duration-250",
              isActive
                ? "text-foreground after:scale-x-100"
                : "text-muted-foreground after:scale-x-0 hover:after:scale-x-100"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
