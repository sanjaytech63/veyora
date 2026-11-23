"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Category } from "@veyora/types";
import { cn } from "@/lib/utils";

interface SearchPopularCategoriesProps {
  categories: Category[];
  onSelectCategory: (slug: string, name: string) => void;
  activeIndex?: number;
  highlightedCategoryIds?: string[];
  className?: string;
}

export function SearchPopularCategories({
  categories,
  onSelectCategory,
  highlightedCategoryIds = [],
  className,
}: SearchPopularCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Curated Departments</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = highlightedCategoryIds.includes(cat.id);
          return (
            <Button
              key={cat.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectCategory(cat.slug, cat.name)}
              className={cn(
                "rounded-full text-xs font-medium h-7 px-3 bg-muted/30 hover:bg-accent hover:border-primary/40 transition-colors",
                isSelected && "border-primary bg-primary/10 text-primary"
              )}
            >
              {cat.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
