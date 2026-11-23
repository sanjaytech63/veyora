"use client";

import * as React from "react";
import { Search, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestionsProps {
  suggestions: string[];
  categories: { id: string; name: string; slug: string }[];
  onSelectSuggestion: (term: string) => void;
  onSelectCategory: (slug: string, name: string) => void;
  activeItemId?: string;
  className?: string;
}

export function SearchSuggestions({
  suggestions,
  categories,
  onSelectSuggestion,
  onSelectCategory,
  activeItemId,
  className,
}: SearchSuggestionsProps) {
  if (suggestions.length === 0 && categories.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {categories.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Matching Departments
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const itemId = `cat-match-${cat.id}`;
              const isActive = activeItemId === itemId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.slug, cat.name)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-accent transition-colors",
                    isActive && "border-primary bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Suggestions
          </div>
          <div className="divide-y divide-border/30 rounded-xl overflow-hidden border border-border/40">
            {suggestions.map((sug, idx) => {
              const itemId = `sug-${idx}`;
              const isActive = activeItemId === itemId;
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => onSelectSuggestion(sug)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-accent/60 transition-colors",
                    isActive && "bg-accent text-primary font-semibold"
                  )}
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{sug}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
