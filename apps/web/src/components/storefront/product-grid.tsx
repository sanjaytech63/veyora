"use client";

import * as React from "react";
import { Product, Category } from "@veyora/types";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  categories?: Category[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilters?: () => void;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}

export function ProductGrid({
  products,
  categories = [],
  loading = false,
  emptyTitle = "No hardware matches your filter",
  emptyDescription = "Adjust your active department or reset filters to view the full Veyora catalog.",
  onResetFilters,
  className,
  columns = 4,
}: ProductGridProps) {
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const gridColsClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : columns === 5
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  if (loading) {
    return (
      <div className={cn("grid gap-5 sm:gap-6", gridColsClass, className)}>
        {Array.from({ length: columns === 4 ? 8 : 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-[22px] border border-border/50 bg-card/60"
          >
            <div className="p-2 pb-0">
              <Skeleton className="aspect-[4/4.6] w-full rounded-[16px]" />
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-4 w-10 rounded-md" />
              </div>
              <Skeleton className="mt-2.5 h-4 w-4/5 rounded-md" />
              <div className="mt-3.5 flex items-center gap-1.5">
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3.5">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/80 bg-muted/20 py-16 px-4">
        <EmptyState
          icon={<SlidersHorizontal className="h-5 w-5 text-muted-foreground" />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            onResetFilters ? (
              <Button
                onClick={onResetFilters}
                variant="outline"
                size="sm"
                className="rounded-full px-5 text-xs font-semibold"
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-5 sm:gap-6", gridColsClass, className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryName={categoryMap.get(product.categoryId)}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
