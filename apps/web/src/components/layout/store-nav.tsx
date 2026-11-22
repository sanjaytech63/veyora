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
import { useCategories } from "@/hooks/use-catalog";

export function StoreNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: categories = [] } = useCategories();

  const activeCategories = React.useMemo(() => {
    return categories.filter((c) => c.status === "active");
  }, [categories]);

  return (
    <nav className={cn("hidden lg:flex items-center gap-1", className)}>
      {/* 1. Home */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase"
      >
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
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase"
      >
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

      {/* 3. Dynamic Categories Dropdown or Direct Links */}
      {activeCategories.length > 0 && activeCategories.length <= 3 ? (
        activeCategories.map((cat) => (
          <Button
            key={cat.id}
            asChild
            variant="ghost"
            size="sm"
            className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase"
          >
            <Link
              href={`/category/${cat.slug}`}
              className={cn(
                "transition-colors hover:text-primary",
                pathname.includes(cat.slug) ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              {cat.name}
            </Link>
          </Button>
        ))
      ) : activeCategories.length > 3 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 px-3.5 font-semibold text-xs tracking-wider uppercase gap-1",
                pathname.startsWith("/category")
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              )}
            >
              <span>Categories</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 p-2.5 rounded-2xl border border-border/80 bg-card shadow-xl space-y-1"
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary flex items-center justify-between">
              <span>Curated Departments</span>
              <Sparkles className="h-3 w-3" />
            </div>
            {activeCategories.slice(0, 8).map((cat) => (
              <DropdownMenuItem key={cat.id} asChild>
                <Link
                  href={`/category/${cat.slug}`}
                  className="cursor-pointer text-xs font-medium py-2 rounded-xl"
                >
                  {cat.name}
                </Link>
              </DropdownMenuItem>
            ))}
            <div className="pt-2 border-t border-border/60 mt-1">
              <Link
                href="/shop"
                className="flex items-center justify-between text-xs font-semibold text-primary px-2 py-1 hover:underline"
              >
                <span>View All Garments</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* 4. New Arrivals */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase"
      >
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

      {/* 5. Collections */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-9 px-3.5 font-semibold text-xs tracking-wider uppercase"
      >
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
