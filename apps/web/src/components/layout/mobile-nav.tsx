"use client";

import * as React from "react";
import Link from "next/link";
import { useUIStore } from "@/stores/ui-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X, Sparkles, Shirt, Layers, Crown, Flame, Gem } from "lucide-react";
import { SERVICES } from "@veyora/config";

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  const links = [
    { label: "Home", href: "/", icon: Sparkles },
    { label: "Shop All Clothing", href: "/shop", icon: ShoppingBag },
    { label: "Kurtis & Kurti Sets", href: "/category/kurtis", icon: Shirt },
    { label: "Ethnic & Festive Wear", href: "/category/ethnic-wear", icon: Crown },
    { label: "Sarees & Drapes", href: "/category/sarees", icon: Gem },
    { label: "Co-ords & Loungewear", href: "/category/co-ords", icon: Layers },
    { label: "New Arrivals", href: "/new-arrivals", icon: Flame },
    { label: "Curated Collections", href: "/collections", icon: Sparkles },
  ];

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="p-4 w-[300px] sm:w-[350px]">
        <SheetHeader className="flex flex-row items-center justify-between border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-base font-bold">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span>{SERVICES.NAME} <span className="text-xs font-normal text-muted-foreground">Fashion</span></span>
          </SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="flex flex-col gap-1 py-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
