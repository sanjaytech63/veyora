"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/use-catalog";
import { Search, ArrowRight, Loader2, Package, Sparkles } from "lucide-react";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POPULAR_SEARCHES = [
  "Headphones",
  "Mechanical Keyboard",
  "Wireless Mouse",
  "Desk Pad",
  "MagSafe Stand",
];

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const { data: results, isLoading } = useSearch(query);

  // Keyboard shortcut Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onOpenChange(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectQuickSearch = (term: string) => {
    setQuery(term);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Catalog</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="border-b border-border/60">
          <div className="flex items-center px-4 py-3.5 gap-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, or collections..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-base shadow-none bg-transparent"
              autoFocus
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.trim().length === 0 ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectQuickSearch(term)}
                    className="rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:border-primary/40 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Products ({results.length})
              </div>
              <div className="divide-y divide-border/40">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-accent/60 transition-colors group"
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted/40 border border-border/40">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {product.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  View all results for &ldquo;{query}&rdquo;
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground space-y-1">
              <p className="text-sm font-medium text-foreground">No matches found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs">Try searching for audio, keyboards, or leather desk accessories.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
