"use client";

import * as React from "react";
import { Category, Product } from "@veyora/types";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { useProducts } from "@/hooks/use-catalog";
import { cn } from "@/lib/utils";

interface CuratedCollectionClientProps {
  categories: Category[];
  initialProducts?: Product[];
}

export function CuratedCollectionClient({
  categories,
  initialProducts = [],
}: CuratedCollectionClientProps) {
  const [activeCollectionTab, setActiveCollectionTab] = React.useState<string>("all");

  const { data: collectionProductsData, isLoading } = useProducts({
    categoryId: activeCollectionTab === "all" ? undefined : activeCollectionTab,
    limit: 8,
  });

  const products =
    collectionProductsData?.items || (activeCollectionTab === "all" ? initialProducts : []);

  return (
    <section id="collections">
      <Container size="xl" className="space-y-10">
        <div className="flex flex-col justify-between gap-6 border-b border-border/60 pb-6 lg:flex-row lg:items-end">
          <div>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              03 // Curated Edits
            </span>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Curated for Every Occasion
            </h2>
          </div>

          {/* Segmented Pill Filter Dock */}
          <div className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl border border-border/70 bg-muted/50 p-1.5 backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveCollectionTab("all")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-semibold h-auto transition-all duration-200",
                activeCollectionTab === "all"
                  ? "bg-background text-foreground shadow-xs ring-1 ring-border/60 hover:bg-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              )}
            >
              All Apparel
            </Button>
            {categories.map((cat) => {
              const isActive = activeCollectionTab === cat.id;
              return (
                <Button
                  key={cat.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveCollectionTab(cat.id)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-xs font-semibold h-auto transition-all duration-200",
                    isActive
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border/60 hover:bg-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  )}
                >
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>

        <ProductGrid
          products={products}
          categories={categories}
          loading={isLoading && !products.length}
          emptyTitle="No apparel available in this department"
          emptyDescription="Garments added to this category will be displayed here."
          onResetFilters={
            activeCollectionTab !== "all" ? () => setActiveCollectionTab("all") : undefined
          }
          columns={4}
        />
      </Container>
    </section>
  );
}
