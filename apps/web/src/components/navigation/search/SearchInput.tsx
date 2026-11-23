"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      onKeyDown,
      isLoading = false,
      autoFocus = true,
      placeholder = "Search kurtis, lehengas, bandhgalas, or fabrics...",
      className,
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "relative flex items-center px-4 py-3.5 border-b border-border/60 bg-background",
          className
        )}
      >
        <Search
          className="h-4 w-4 text-muted-foreground shrink-0 mr-3 pointer-events-none"
          aria-hidden="true"
        />
        <Input
          ref={ref}
          type="search"
          role="searchbox"
          aria-label="Search luxury menswear and apparel catalog"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm md:text-base shadow-none bg-transparent placeholder:text-muted-foreground/70 h-8"
        />

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isLoading && (
            <LoaderCircle
              className="h-4 w-4 animate-spin text-muted-foreground"
              aria-label="Loading search results"
            />
          )}

          {value.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClear}
              aria-label="Clear search input"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
