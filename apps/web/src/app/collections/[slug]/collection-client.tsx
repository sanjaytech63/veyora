"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useCategories, useProducts, useCollection } from "@/hooks/use-catalog";
import { ArrowLeft, Sparkles, LoaderCircle } from "lucide-react";
import { Collection } from "@veyora/types";

interface CollectionClientProps {
  initialCollection: Collection;
}

export function CollectionClient({ initialCollection }: CollectionClientProps) {
  const { data: collection = initialCollection, isLoading: isCollectionLoading } = useCollection(
    initialCollection.slug
  );
  const { data: categories = [] } = useCategories();

  const { data: productsData, isLoading: isProductsLoading } = useProducts({
    limit: 16,
  });

  const activeCollection = collection || initialCollection;
  const allProducts = productsData?.items || [];

  // Filter products by collection's explicit productIds if assigned, or show available products
  const products = React.useMemo(() => {
    if (!activeCollection) return [];
    if (activeCollection.productIds && activeCollection.productIds.length > 0) {
      return allProducts.filter((p) => activeCollection.productIds?.includes(p.id));
    }
    return allProducts;
  }, [activeCollection, allProducts]);

  if (isCollectionLoading && !activeCollection) {
    return (
      <div className="py-24 text-center">
        <Container size="xl" className="space-y-4 flex flex-col items-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading collection...</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 space-y-12">
      <Container size="xl" className="space-y-10">
        {/* Breadcrumb Trail */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-foreground transition-colors">
            Collections
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{activeCollection.name}</span>
        </nav>

        {/* Collection Hero Stage */}
        <div className="relative overflow-hidden rounded-[32px] border border-border/80 bg-zinc-950 p-8 sm:p-14 text-white shadow-2xl">
          {activeCollection.image && (
            <OptimizedImage
              src={activeCollection.image}
              alt={activeCollection.name}
              fill
              priority
              className="object-cover object-center opacity-40"
              sizes="100vw"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-amber-300 backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              <span>{activeCollection.season || "Seasonal Lookbook"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {activeCollection.name}
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {activeCollection.description ||
                activeCollection.tagline ||
                "Handcrafted luxury Indian attire and seasonal edits."}
            </p>
          </div>
        </div>

        {/* Back and count toolbar */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
            <Link href="/collections" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Collections</span>
            </Link>
          </Button>

          <span className="text-xs text-muted-foreground">
            {products.length === 1 ? "1 Garment" : `${products.length} Garments`}
          </span>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={products}
          categories={categories}
          loading={isProductsLoading}
          columns={4}
          emptyTitle="No garments in this collection yet"
          emptyDescription="Garments will appear here once assigned to this collection in the catalog."
        />
      </Container>
    </div>
  );
}
