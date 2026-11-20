import * as React from "react";
import { Product, Category } from "@veyora/types";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  categories?: Category[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilters?: () => void;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({
  products,
  categories = [],
  loading = false,
  emptyTitle = "No products found",
  emptyDescription = "We couldn't find any items matching your selected criteria.",
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
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  if (loading) {
    return (
      <div className={cn("grid gap-6 sm:gap-8", gridColsClass, className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card p-4 space-y-4"
          >
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<PackageSearch className="h-6 w-6" />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            onResetFilters ? (
              <Button onClick={onResetFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6 sm:gap-8", gridColsClass, className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryName={categoryMap.get(product.categoryId)}
        />
      ))}
    </div>
  );
}
