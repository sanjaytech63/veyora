"use client";

import * as React from "react";
import Link from "next/link";
import { useUIStore } from "@/stores/ui-store";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X, Compass, Headphones, Laptop, Zap, Briefcase } from "lucide-react";
import { SERVICES } from "@veyora/config";

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  const links = [
    { label: "Home", href: "/", icon: Compass },
    { label: "Shop All Products", href: "/shop", icon: ShoppingBag },
    { label: "Acoustic Audio", href: "/category/audio", icon: Headphones },
    { label: "Workspace Precision", href: "/category/workspace", icon: Laptop },
    { label: "Power & Charging", href: "/category/power", icon: Zap },
    { label: "Bespoke Carry", href: "/category/carry", icon: Briefcase },
  ];

  return (
    <Drawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <DrawerContent className="p-4 max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="flex items-center gap-2 text-base font-bold">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {SERVICES.NAME}
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
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
      </DrawerContent>
    </Drawer>
  );
}
