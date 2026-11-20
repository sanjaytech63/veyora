"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { StoreNav } from "./store-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { ShoppingBag, Menu, Search, ShoppingCart } from "lucide-react";
import { SERVICES } from "@veyora/config";

export function StoreHeader() {
  const { setMobileNavOpen, setCartDrawerOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <Container size="xl" className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span>{SERVICES.NAME}</span>
          </Link>
        </div>

        <StoreNav />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => {}}>
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Shopping Cart Drawer"
            onClick={() => setCartDrawerOpen(true)}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              0
            </span>
          </Button>

          <ThemeToggle />
        </div>
      </Container>
      <MobileNav />
    </header>
  );
}
