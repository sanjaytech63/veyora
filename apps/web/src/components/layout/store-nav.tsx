"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoreNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("hidden lg:flex items-center gap-1", className)}>
      {/* 1. Home */}
      <Button asChild variant="ghost" size="sm" className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/" ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          Home
        </Link>
      </Button>

      {/* 2. Shop All */}
      <Button asChild variant="ghost" size="sm" className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase">
        <Link
          href="/shop"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/shop" ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          Shop All
        </Link>
      </Button>

      {/* 3. Kurtis & Sets Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 px-3.5 font-semibold text-xs tracking-wider uppercase gap-1",
              pathname.includes("/kurtis") ? "text-primary font-bold" : "text-muted-foreground"
            )}
          >
            <span>Kurtis &amp; Sets</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 p-3 rounded-2xl border border-border/80 bg-card shadow-xl space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary flex items-center justify-between">
            <span>Kurtis &amp; Salwar Suits</span>
            <Sparkles className="h-3 w-3" />
          </div>
          <DropdownMenuItem asChild>
            <Link href="/category/kurtis" className="cursor-pointer text-xs font-medium py-2 rounded-xl">
              Straight Cut Daily Kurtis
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/category/kurtis" className="cursor-pointer text-xs font-medium py-2 rounded-xl">
              Anarkali Suits with Dupatta
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/category/kurtis" className="cursor-pointer text-xs font-medium py-2 rounded-xl">
              Pure Mulmul Block Prints
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/category/kurtis" className="cursor-pointer text-xs font-medium py-2 rounded-xl">
              Chanderi Silk Festive Sets
            </Link>
          </DropdownMenuItem>
          <div className="pt-2 border-t border-border/60 mt-1">
            <Link
              href="/category/kurtis"
              className="flex items-center justify-between text-xs font-semibold text-primary px-2 py-1 hover:underline"
            >
              <span>Explore All Kurtis</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 4. Ethnic & Festive Wear Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 px-3.5 font-semibold text-xs tracking-wider uppercase gap-1",
              pathname.includes("/ethnic-wear") || pathname.includes("/sarees") ? "text-primary font-bold" : "text-muted-foreground"
            )}
          >
            <span>Ethnic &amp; Festive</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 p-3 rounded-2xl border border-border/80 bg-card shadow-xl space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary flex items-center justify-between">
            <span>Traditional Indian Couture</span>
            <Sparkles className="h-3 w-3" />
          </div>
          <DropdownMenuItem asChild>
            <Link href="/category/ethnic-wear" className="cursor-pointer text-xs font-medium py-2 rounded-xl">
              Bridal &amp; Sangeet Lehengas
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/category/ethnic-wear" className="cursor-pointer text-xs font-medium py-2 rounded-xl">
              Rajasthani Ghagra Choli
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/category/sarees" className="cursor-pointer text-xs font-medium py-2 rounded-xl">
              Banarasi Katan Silk Sarees
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/category/accessories" className="cursor-pointer text-xs font-medium py-2 rounded-xl">
              Mirror-Work Silk Dupattas
            </Link>
          </DropdownMenuItem>
          <div className="pt-2 border-t border-border/60 mt-1">
            <Link
              href="/category/ethnic-wear"
              className="flex items-center justify-between text-xs font-semibold text-primary px-2 py-1 hover:underline"
            >
              <span>View Festive Edit</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 5. New Arrivals */}
      <Button asChild variant="ghost" size="sm" className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase">
        <Link
          href="/new-arrivals"
          className={cn(
            "transition-colors hover:text-primary flex items-center gap-1.5",
            pathname === "/new-arrivals" ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <span>New Arrivals</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </Link>
      </Button>

      {/* 6. Collections */}
      <Button asChild variant="ghost" size="sm" className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase">
        <Link
          href="/collections"
          className={cn(
            "transition-colors hover:text-primary",
            pathname === "/collections" ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          Collections
        </Link>
      </Button>
    </nav>
  );
}
