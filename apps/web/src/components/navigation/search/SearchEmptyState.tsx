"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { Category } from "@veyora/types";
import { SearchPopularCategories } from "./SearchPopularCategories";
import { cn } from "@/lib/utils";

interface SearchEmptyStateProps {
  query: string;
  categories: Category[];
  onClear: () => void;
  onSelectCategory: (slug: string, name: string) => void;
  className?: string;
}

export function SearchEmptyState({
  query,
  categories,
  onClear,
  onSelectCategory,
  className,
}: SearchEmptyStateProps) {
  return (
    <div className={cn("py-8 text-center space-y-6", className)}>
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <SearchX className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          No matches found for &ldquo;{query}&rdquo;
        </h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          We couldn&apos;t find any garments matching your search. Try checking your spelling or
          explore our curated departments below.
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          className="rounded-full text-xs h-7 px-3 mt-2"
        >
          Clear search query
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="pt-4 border-t border-border/40 text-left">
          <SearchPopularCategories categories={categories} onSelectCategory={onSelectCategory} />
        </div>
      )}
    </div>
  );
}
