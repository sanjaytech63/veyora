"use client";

import * as React from "react";
import { Product } from "@veyora/types";
import { SearchProductCard } from "./SearchProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  products: Product[];
  query: string;
  onSelectProduct: (slug: string, title: string) => void;
  onViewAll: () => void;
  activeItemId?: string;
  className?: string;
}

export function SearchResults({
  products,
  query,
  onSelectProduct,
  onViewAll,
  activeItemId,
  className,
}: SearchResultsProps) {
  if (products.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Garments ({products.length})
        </span>
      </div>

      <div className="divide-y divide-border/40 rounded-xl overflow-hidden border border-border/40 bg-card/40">
        {products.map((product) => {
          const itemId = `prod-${product.id}`;
          const isActive = activeItemId === itemId;
          return (
            <SearchProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              isActive={isActive}
            />
          );
        })}
      </div>

      <div className="pt-2 text-center">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onViewAll}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
        >
          <span>View all results for &ldquo;{query}&rdquo;</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
