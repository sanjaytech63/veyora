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
import { ShoppingBag, X } from "lucide-react";

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();

  return (
    <Drawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <DrawerContent className="p-4 max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Veyora Navigation
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="flex flex-col gap-3 py-6">
          <Link
            href="/"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center rounded-md px-3 py-2 text-base font-medium hover:bg-accent"
          >
            Home
          </Link>
          <Link
            href="/#catalog"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center rounded-md px-3 py-2 text-base font-medium hover:bg-accent"
          >
            Catalog
          </Link>
          <Link
            href="/#collections"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center rounded-md px-3 py-2 text-base font-medium hover:bg-accent"
          >
            Collections
          </Link>
          <Link
            href="/#design-system"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center rounded-md px-3 py-2 text-base font-medium hover:bg-accent"
          >
            Design System Components
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
