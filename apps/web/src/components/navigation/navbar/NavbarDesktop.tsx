"use client";

import * as React from "react";
import { Container } from "@/components/ui/container";
import { NavbarLogo } from "./NavbarLogo";
import { NavbarLinks } from "./NavbarLinks";
import { NavbarCategoryMenu } from "./NavbarCategoryMenu";
import { NavbarActions } from "./NavbarActions";
import { cn } from "@/lib/utils";

interface NavbarDesktopProps {
  onOpenSearch: () => void;
  className?: string;
}

export function NavbarDesktop({ onOpenSearch, className }: NavbarDesktopProps) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "hidden md:block w-full transition-all duration-200",
        scrolled && "shadow-xs bg-background/95 backdrop-blur-md",
        className
      )}
    >
      <Container size="xl" className="flex h-16 items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="shrink-0">
          <NavbarLogo />
        </div>

        {/* Primary Desktop Navigation Links + Dynamic Categories */}
        <nav className="flex items-center gap-0.5 xl:gap-1 min-w-0" aria-label="Main Navigation">
          <NavbarLinks />
          <NavbarCategoryMenu />
        </nav>

        {/* Actions (Search, Wishlist, Cart, Theme, Account) */}
        <NavbarActions onOpenSearch={onOpenSearch} className="shrink-0" />
      </Container>
    </div>
  );
}
