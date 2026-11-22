"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useCategories, useProducts, useCollection } from "@/hooks/use-catalog";
import { ArrowLeft, Sparkles, LoaderCircle } from "lucide-react";

export default function SingleCollectionPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: collection, isLoading: isCollectionLoading } = useCollection(slug);
  const { data: categories = [] } = useCategories();

  const { data: productsData, isLoading: isProductsLoading } = useProducts({
    limit: 16,
  });

  if (!isCollectionLoading && !collection) {
    notFound();
  }

  const allProducts = productsData?.items || [];
  // Filter products by collection's explicit productIds if assigned, or show available products
  const products = React.useMemo(() => {
    if (!collection) return [];
    if (collection.productIds && collection.productIds.length > 0) {
      return allProducts.filter((p) => collection.productIds?.includes(p.id));
    }
    return allProducts;
  }, [collection, allProducts]);

  if (isCollectionLoading) {
    return (
      <div className="py-24 text-center">
        <Container size="xl" className="space-y-4 flex flex-col items-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading collection...</p>
        </Container>
      </div>
    );
  }

  if (!collection) {
    return null;
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
          <span className="font-semibold text-foreground">{collection.name}</span>
        </nav>

        {/* Collection Hero Stage */}
        <div className="relative overflow-hidden rounded-[32px] border border-border/80 bg-zinc-950 p-8 sm:p-14 text-white shadow-2xl">
          {collection.image && (
            <OptimizedImage
              src={collection.image}
              alt={collection.name}
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
              <span>{collection.season || "Seasonal Lookbook"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {collection.name}
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {collection.description ||
                collection.tagline ||
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
