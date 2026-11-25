"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import { useCategories } from "@/hooks/use-catalog";
import { cn } from "@/lib/utils";

interface NavbarCategoryMenuProps {
  className?: string;
  onNavigate?: () => void;
}

export function NavbarCategoryMenu({ className, onNavigate }: NavbarCategoryMenuProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = React.useState(false);
  const { data: categories = [], isLoading } = useCategories();

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const activeCategories = React.useMemo(() => {
    return categories.filter((c) => c.status === "active");
  }, [categories]);

  if (!isHydrated || isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    );
  }

  if (activeCategories.length === 0) {
    return null;
  }

  // If few categories, display inline
  if (activeCategories.length <= 3) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {activeCategories.map((cat) => (
          <Button
            key={cat.id}
            asChild
            variant="ghost"
            size="sm"
            className="relative h-10 rounded-md px-3 font-semibold text-[11px] tracking-[0.12em] uppercase transition-colors duration-200 hover:bg-accent/70 hover:text-foreground"
          >
            <Link
              href={`/category/${cat.slug}`}
              onClick={onNavigate}
              className={cn(
                "relative transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-primary after:transition-transform after:duration-250",
                pathname.includes(cat.slug)
                  ? "text-primary font-bold after:scale-x-100"
                  : "text-muted-foreground after:scale-x-0 hover:after:scale-x-100"
              )}
            >
              {cat.name}
            </Link>
          </Button>
        ))}
      </div>
    );
  }

  // Otherwise, dropdown menu
  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "relative h-10 rounded-md px-3 font-semibold text-[11px] tracking-[0.12em] uppercase gap-1 outline-none transition-colors duration-200",
              "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:bg-primary after:transition-transform after:duration-250",
              "hover:bg-accent/70 hover:text-foreground",
              pathname.startsWith("/category")
                ? "text-foreground after:scale-x-100"
                : "text-muted-foreground after:scale-x-0 hover:after:scale-x-100"
            )}
          >
            <span>Categories</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[22rem] p-3 rounded-lg border border-border/80 bg-popover shadow-lg space-y-1"
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary flex items-center justify-between">
            <span>Curated Departments</span>
            <Sparkles className="h-3 w-3" />
          </div>
          {activeCategories.slice(0, 8).map((cat) => (
            <DropdownMenuItem key={cat.id} asChild>
              <Link
                href={`/category/${cat.slug}`}
                onClick={onNavigate}
                className="cursor-pointer text-xs font-medium py-2 rounded-xl flex items-center justify-between"
              >
                <span>{cat.name}</span>
              </Link>
            </DropdownMenuItem>
          ))}
          <div className="pt-2 border-t border-border/60 mt-1">
            <Link
              href="/shop"
              onClick={onNavigate}
              className="flex items-center justify-between text-xs font-semibold text-primary px-2 py-1 hover:underline"
            >
              <span>View All Garments</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
