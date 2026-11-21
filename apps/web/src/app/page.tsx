"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ProductGrid } from "@/components/storefront/product-grid";
import { useCategories, useFeaturedProducts, useProducts } from "@/hooks/use-catalog";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Compass,
  Headphones,
  Laptop,
  Zap,
  Briefcase,
  Star,
} from "lucide-react";

export default function StorefrontHomePage() {
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts(4);
  const [activeCollectionTab, setActiveCollectionTab] = React.useState<string>("all");

  const { data: collectionProductsData, isLoading: collectionLoading } = useProducts({
    categoryId: activeCollectionTab === "all" ? undefined : activeCollectionTab,
    limit: 8,
  });

  const categoryIcons: Record<string, React.ElementType> = {
    audio: Headphones,
    workspace: Laptop,
    power: Zap,
    carry: Briefcase,
  };

  return (
    <div className="space-y-24 pb-24">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/30 via-background to-background pt-12 pb-20 md:pt-20 md:pb-32 border-b border-border/40">
        <Container size="xl" className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Editorial Headline & CTAs */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Veyora 2026 Collection • Hardware Redefined
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
                Precision instruments for modern living.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Engineered from aircraft-grade aluminum, virgin merino wool, and custom acoustic drivers. Designed for tactile clarity and effortless performance.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-md shadow-primary/10 w-full sm:w-auto">
                  <Link href="/shop" className="inline-flex items-center gap-2">
                    Explore Storefront
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="rounded-full px-8 font-semibold w-full sm:w-auto border-border/80">
                  <Link href="/category/audio">
                    Acoustic Hardware
                  </Link>
                </Button>
              </div>

              {/* Trust Metrics Pill */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Carbon-Neutral Dispatch</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>2-Year Atelier Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <span>30-Day Risk-Free Trial</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Feature Stage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto aspect-square max-w-md lg:max-w-none overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-tr from-muted/60 via-card to-card p-3 shadow-2xl">
                <div className="relative h-full w-full overflow-hidden rounded-2xl bg-zinc-950">
                  <OptimizedImage
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop"
                    alt="Aura Spatial Wireless Headphones Flagship"
                    fill
                    priority
                    className="h-full w-full object-cover object-center opacity-90 transition-transform duration-1000 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  {/* Floating Highlight Card */}
                  <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          Flagship Release
                        </div>
                        <h4 className="text-sm font-semibold tracking-tight text-white mt-0.5">
                          Aura Spatial Wireless Headphones
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">$389</span>
                        <div className="text-[10px] text-zinc-400 line-through">$449</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Featured Categories Section */}
      <section id="categories">
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Curated Departments
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Browse by Category
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              View Full Index
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {catsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
                ))
              : categories.map((cat) => {
                  const Icon = categoryIcons[cat.slug] || Compass;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-border hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                      </div>

                      <div className="mt-12 space-y-1">
                        <h3 className="font-bold text-foreground tracking-tight text-lg group-hover:text-primary transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {cat.description || "Discover verified models and accessories."}
                        </p>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </Container>
      </section>

      {/* 3. Featured Products Showcase */}
      <section>
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Atelier Highlights
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Featured Hardware
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Shop All Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ProductGrid
            products={featuredProducts}
            categories={categories}
            loading={featuredLoading}
            columns={4}
          />
        </Container>
      </section>

      {/* 4. Promotional Editorial Section */}
      <section>
        <Container size="xl">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-8 sm:p-12 md:p-16 border border-zinc-800 shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-6">
              <Badge variant="outline" className="border-white/30 text-white font-semibold text-xs py-1 px-3">
                Design Philosophy
              </Badge>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Simplicity is the resolution of complexity.
              </h2>

              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Every Veyora instrument begins with an uncompromising material foundation. We eliminate ornamental excess in pursuit of pure ergonomic performance and tactile weight.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold">
                  <Link href="/category/workspace">
                    Explore Workspace Hardware
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-zinc-700 text-white hover:bg-zinc-800">
                  <Link href="/shop">
                    View Complete Catalog
                  </Link>
                </Button>
              </div>
            </div>

            {/* Background Accent Gradients */}
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute right-1/4 bottom-0 -mb-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          </div>
        </Container>
      </section>

      {/* 5. Product Collections Tabs */}
      <section id="collections">
        <Container size="xl" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Curated Collections
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Crafted for Every Workflow
              </h2>
            </div>

            {/* Collection Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeCollectionTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCollectionTab("all")}
                className="rounded-full text-xs font-semibold"
              >
                All Departments
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant={activeCollectionTab === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCollectionTab(cat.id)}
                  className="rounded-full text-xs font-semibold"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          <ProductGrid
            products={collectionProductsData?.items || []}
            categories={categories}
            loading={collectionLoading}
            columns={4}
          />
        </Container>
      </section>
    </div>
  );
}
