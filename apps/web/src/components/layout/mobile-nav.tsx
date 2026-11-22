"use client";

import * as React from "react";
import Link from "next/link";
import { useUIStore } from "@/stores/ui-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X, Sparkles, Flame, Tag } from "lucide-react";
import { SERVICES } from "@veyora/config";
import { useCategories } from "@/hooks/use-catalog";

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();
  const { data: categories = [] } = useCategories();

  const activeCategories = React.useMemo(() => {
    return categories.filter((c) => c.status === "active");
  }, [categories]);

  const baseLinks = [
    { label: "Home", href: "/", icon: Sparkles },
    { label: "Shop All Garments", href: "/shop", icon: ShoppingBag },
    { label: "New Arrivals", href: "/new-arrivals", icon: Flame },
    { label: "Curated Collections", href: "/collections", icon: Sparkles },
  ];

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="p-4 w-[300px] sm:w-[350px] overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-base font-bold">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span>
              {SERVICES.NAME}{" "}
              <span className="text-xs font-normal text-muted-foreground">Fashion</span>
            </span>
          </SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {/* Primary Links */}
        <div className="flex flex-col gap-1 py-3 border-b border-border/60">
          {baseLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Dynamic Categories From DB */}
        {activeCategories.length > 0 && (
          <div className="flex flex-col gap-1 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
              Curated Departments
            </span>
            {activeCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
