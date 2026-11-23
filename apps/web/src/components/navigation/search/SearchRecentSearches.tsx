"use client";

import * as React from "react";
import { History, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchRecentSearchesProps {
  searches: string[];
  onSelect: (term: string) => void;
  onRemove: (e: React.MouseEvent, term: string) => void;
  onClearAll: () => void;
  highlightedTerms?: string[];
  className?: string;
}

export function SearchRecentSearches({
  searches,
  onSelect,
  onRemove,
  onClearAll,
  highlightedTerms = [],
  className,
}: SearchRecentSearchesProps) {
  if (!searches || searches.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          Recent Searches
        </span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {searches.map((term) => {
          const isHighlighted = highlightedTerms.includes(term);
          return (
            <div
              key={term}
              onClick={() => onSelect(term)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(term);
                }
              }}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-accent cursor-pointer transition-colors",
                isHighlighted && "border-primary bg-primary/10 text-primary"
              )}
            >
              <span>{term}</span>
              <button
                type="button"
                onClick={(e) => onRemove(e, term)}
                aria-label={`Remove recent search "${term}"`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
