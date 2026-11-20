"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { useSearch, useCategories } from "@/hooks/use-catalog";
import { Search, X, Sparkles, ArrowRight } from "lucide-react";

const SUGGESTED_TERMS = [
  "Aura Headphones",
  "Keystroke 75",
  "Mechanical Keyboard",
  "Precision Mouse",
  "Leather Desk Mat",
  "MagSafe Stand",
];

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [inputVal, setInputVal] = React.useState(initialQuery);
  const [activeQuery, setActiveQuery] = React.useState(initialQuery);

  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useSearch(activeQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    setActiveQuery(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectSuggested = (term: string) => {
    setInputVal(term);
    setActiveQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="py-8 md:py-16 space-y-12">
      <Container size="xl" className="space-y-8">
        {/* Search Header Banner */}
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Catalog Search
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Search Hardware & Atelier Collections
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative mt-4">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search by product name, category, or specifications..."
              className="pl-12 pr-10 py-6 text-base rounded-2xl border-border/80 shadow-sm"
              autoFocus
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => {
                  setInputVal("");
                  setActiveQuery("");
                  router.push("/search");
                }}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Suggested Terms Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Suggestions:
            </span>
            {SUGGESTED_TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSelectSuggested(term)}
                className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-foreground hover:bg-accent hover:border-primary/40 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Results Stage */}
        <div className="pt-4 border-t border-border/60 space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {activeQuery ? (
                <>
                  Showing <strong>{products.length}</strong> results for &ldquo;
                  <span className="text-foreground font-semibold">{activeQuery}</span>&rdquo;
                </>
              ) : (
                "Enter a search query above to explore our hardware index."
              )}
            </span>

            {activeQuery && (
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/shop" className="inline-flex items-center gap-1.5">
                  View Full Catalog
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>

          <ProductGrid
            products={products}
            categories={categories}
            loading={isLoading}
            columns={4}
            emptyTitle={
              activeQuery
                ? `No results found for "${activeQuery}"`
                : "Search the Veyora catalog"
            }
            emptyDescription={
              activeQuery
                ? "Try checking your spelling or search by general keyword like 'audio' or 'keyboard'."
                : "Explore our collection of precision hardware, acoustic listening gear, and desk instruments."
            }
          />
        </div>
      </Container>
    </div>
  );
}
