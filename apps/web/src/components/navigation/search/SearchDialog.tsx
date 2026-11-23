"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchInput } from "./SearchInput";
import { SearchSuggestions } from "./SearchSuggestions";
import { SearchResults } from "./SearchResults";
import { SearchPopularCategories } from "./SearchPopularCategories";
import { SearchRecentSearches } from "./SearchRecentSearches";
import { SearchLoadingState } from "./SearchLoadingState";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchKeyboardHints } from "./SearchKeyboardHints";
import { useProductSearch } from "./useProductSearch";
import { SearchDialogProps } from "./search.types";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchDialog({ open, onOpenChange, className }: SearchDialogProps) {
  const {
    query,
    setQuery,
    debouncedQuery,
    products,
    suggestions,
    suggestedCategories,
    activeCategories,
    recentSearches,
    activeIndex,
    navigationItems,
    isLoading,
    isError,
    refetch,
    handleKeyDown,
    handleSelectRecent,
    handleRemoveRecent,
    handleClearAllRecent,
    handleExecuteSearch,
    handleSelectProduct,
    handleSelectCategory,
  } = useProductSearch(() => onOpenChange(false));

  const activeItem = activeIndex >= 0 ? navigationItems[activeIndex] : undefined;

  const hasQuery = query.trim().length > 0;
  const hasResults = products.length > 0;
  const hasSuggestions = suggestions.length > 0 || suggestedCategories.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-2xl p-0 gap-0 overflow-hidden border-border/80 shadow-2xl rounded-2xl bg-card text-card-foreground max-h-[85vh] flex flex-col",
          className
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search Fashion Catalog</DialogTitle>
        </DialogHeader>

        {/* Search Header Input */}
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          onKeyDown={handleKeyDown}
          isLoading={isLoading}
        />

        {/* Scrollable Results & Suggestions Body */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-5"
          role="region"
          aria-label="Search results and recommendations"
        >
          {isError ? (
            <div className="py-8 text-center space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Unable to reach catalog search service.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-1.5 rounded-full text-xs h-8"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry Search</span>
              </Button>
            </div>
          ) : !hasQuery ? (
            /* Initial State: Recent Searches & Curated Departments */
            <div className="space-y-5 py-1">
              <SearchRecentSearches
                searches={recentSearches}
                onSelect={handleSelectRecent}
                onRemove={handleRemoveRecent}
                onClearAll={handleClearAllRecent}
                highlightedTerms={activeItem?.type === "recent" ? [activeItem.title] : []}
              />

              <SearchPopularCategories
                categories={activeCategories}
                onSelectCategory={handleSelectCategory}
                highlightedCategoryIds={
                  activeItem?.type === "category" ? [activeItem.id.replace("cat-", "")] : []
                }
              />
            </div>
          ) : isLoading ? (
            <SearchLoadingState />
          ) : hasResults || hasSuggestions ? (
            /* Results & Autocomplete State */
            <div className="space-y-4">
              <SearchSuggestions
                suggestions={suggestions}
                categories={suggestedCategories}
                onSelectSuggestion={(sug) => handleExecuteSearch(sug)}
                onSelectCategory={handleSelectCategory}
                activeItemId={activeItem?.id}
              />

              <SearchResults
                products={products}
                query={debouncedQuery || query}
                onSelectProduct={handleSelectProduct}
                onViewAll={() => handleExecuteSearch(query)}
                activeItemId={activeItem?.id}
              />
            </div>
          ) : (
            /* Empty State */
            <SearchEmptyState
              query={query}
              categories={activeCategories}
              onClear={() => setQuery("")}
              onSelectCategory={handleSelectCategory}
            />
          )}
        </div>

        {/* Keyboard Hints Bar */}
        <SearchKeyboardHints />
      </DialogContent>
    </Dialog>
  );
}
