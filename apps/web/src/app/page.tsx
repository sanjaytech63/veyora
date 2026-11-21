"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ProductGrid } from "@/components/storefront/product-grid";
import { useCategories, useFeaturedProducts, useProducts } from "@/hooks/use-catalog";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Compass,
  Headphones,
  Laptop,
  Zap,
  Briefcase,
  Sliders,
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
    <div className="space-y-24 md:space-y-32 pb-28">
      {/* 1. Architectural Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-background pt-10 pb-20 md:pt-16 md:pb-28">
        {/* Precision Engineering Dot-Grid Backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#00000014_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_40%,#000_60%,transparent_100%)] dark:bg-[radial-gradient(#ffffff14_1px,transparent_1px)]"
        />

        <Container size="xl" className="relative z-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left Column: Editorial Typography & Precision Actions */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Release 2026
                </span>
                <span className="h-3 w-[1px] bg-border" />
                <span>Veyora Acoustic &amp; Desk Systems</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-[-0.035em] text-foreground sm:text-6xl xl:text-[68px] leading-[1.04]">
                Precision instruments for{" "}
                <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
                  modern living.
                </span>
              </h1>

              <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
                CNC-machined from aircraft-grade aluminum, virgin merino wool, and custom planar
                drivers. Engineered for tactile clarity and zero visual noise.
              </p>

              <div className="flex flex-col items-center justify-center gap-3.5 pt-1 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-full px-8 text-sm font-semibold shadow-lg shadow-primary/15 transition-all hover:scale-[1.02] sm:w-auto"
                >
                  <Link href="/shop" className="inline-flex items-center gap-2">
                    Explore Catalog
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-full border-border/80 bg-background/60 px-8 text-sm font-semibold backdrop-blur-sm hover:bg-muted/60 sm:w-auto"
                >
                  <Link href="/category/audio">Acoustic Series</Link>
                </Button>
              </div>

              {/* Micro-Telemetry Trust Bar */}
              <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-7 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="flex items-center justify-center gap-2 lg:justify-start">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-card text-foreground">
                    <Truck className="h-3.5 w-3.5" />
                  </div>
                  <span>Carbon-Neutral Express</span>
                </div>
                <div className="flex items-center justify-center gap-2 lg:justify-start">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-card text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <span>2-Year Atelier Warranty</span>
                </div>
                <div className="flex items-center justify-center gap-2 lg:justify-start">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-card text-foreground">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </div>
                  <span>30-Day Home Trial</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Hardware Stage */}
            <div className="lg:col-span-5">
              <div className="group relative mx-auto aspect-[4/4.3] max-w-md lg:max-w-none rounded-[30px] border border-border/80 bg-card/60 p-2.5 shadow-[0_32px_64px_-20px_rgba(0,0,0,0.14)] backdrop-blur-xl dark:shadow-[0_32px_64px_-20px_rgba(0,0,0,0.65)]">
                <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-zinc-950 ring-1 ring-inset ring-white/10">
                  <OptimizedImage
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop"
                    alt="Aura Spatial Wireless Headphones Flagship"
                    fill
                    priority
                    className="h-full w-full object-cover object-center opacity-95 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />

                  {/* Subtle Radial Vignette */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />

                  {/* Top Hardware Spec Pill */}
                  <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                    <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-200 backdrop-blur-md">
                      MODEL // VY-01
                    </span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md">
                      In Stock
                    </span>
                  </div>

                  {/* Floating Glassmorphic Product Dock */}
                  <Link
                    href="/category/audio"
                    className="absolute inset-x-4 bottom-4 block rounded-2xl border border-white/15 bg-zinc-950/70 p-4 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-zinc-950/85"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                          <span>Flagship Acoustic</span>
                          <span>•</span>
                          <span className="text-amber-400">★ 4.98</span>
                        </div>
                        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                          Aura Spatial Wireless Headphones
                        </h2>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right tabular-nums">
                          <div className="text-base font-bold text-white">$389</div>
                          <div className="text-[11px] text-zinc-400 line-through">$449</div>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950 transition-transform duration-300 group-hover:scale-105">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Numbered Departments Bento Grid */}
      <section id="categories">
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                01 // Curated Departments
              </span>
              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Browse by System
              </h2>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors hover:text-primary"
            >
              <span>Complete Hardware Index</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {catsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-52 rounded-[22px] border border-border/50 bg-muted/40 animate-pulse"
                  />
                ))
              : categories.map((cat, idx) => {
                  const Icon = categoryIcons[cat.slug] || Compass;
                  const indexNumber = String(idx + 1).padStart(2, "0");
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] border border-border/60 bg-card/80 p-6 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-foreground/25 hover:bg-card hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07)]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-background text-foreground shadow-2xs transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground/70">
                            /{indexNumber}
                          </span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-all duration-300 group-hover:border-border group-hover:bg-background group-hover:text-foreground">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>

                      <div className="mt-12 space-y-1.5">
                        <h3 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                          {cat.name}
                        </h3>
                        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {cat.description ||
                            "Precision-engineered instruments and modular accessories."}
                        </p>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </Container>
      </section>

      {/* 3. Featured Hardware Showcase */}
      <section>
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                02 // Atelier Highlights
              </span>
              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Featured Hardware
              </h2>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors hover:text-primary"
            >
              <span>Shop All Releases</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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

      {/* 4. Architectural Manifesto Banner */}
      <section>
        <Container size="xl">
          <div className="relative overflow-hidden rounded-[28px] border border-zinc-800/90 bg-zinc-950 p-8 text-white shadow-2xl sm:p-12 md:p-16">
            {/* Subtle Architectural Grid Overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]"
            />

            <div className="relative z-10 grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 font-mono text-[11px] uppercase tracking-widest text-zinc-300">
                  <Sliders className="h-3 w-3 text-emerald-400" />
                  <span>Design Philosophy // 00</span>
                </div>

                <h2 className="text-3xl font-extrabold tracking-[-0.03em] leading-[1.08] sm:text-4xl md:text-5xl">
                  Simplicity is the resolution of complexity.
                </h2>

                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                  Every Veyora instrument begins with an uncompromising material foundation. We
                  strip away ornamental excess in pursuit of pure acoustic fidelity, balanced weight
                  distribution, and enduring utility.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full bg-white px-7 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                  >
                    <Link href="/category/workspace">Explore Workspace Systems</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 rounded-full border-zinc-700 bg-transparent px-7 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <Link href="/shop">View Full Catalog</Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Material Specs Pillar */}
              <div className="lg:col-span-4">
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <div className="space-y-1 border-b border-white/10 pb-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      Chassis
                    </div>
                    <div className="text-sm font-semibold text-zinc-100">6061-T6 Alloy</div>
                  </div>
                  <div className="space-y-1 border-b border-white/10 pb-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      Tolerance
                    </div>
                    <div className="font-mono text-sm font-semibold text-zinc-100">±0.02 mm</div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      Textiles
                    </div>
                    <div className="text-sm font-semibold text-zinc-100">Merino &amp; Cordura</div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      Finish
                    </div>
                    <div className="text-sm font-semibold text-zinc-100">Bead-Blasted Matte</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient Radial Glows */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-1/3 -mb-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
          </div>
        </Container>
      </section>

      {/* 5. Interactive Curated Collections */}
      <section id="collections">
        <Container size="xl" className="space-y-10">
          <div className="flex flex-col justify-between gap-6 border-b border-border/60 pb-6 lg:flex-row lg:items-end">
            <div>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                03 // Curated Collections
              </span>
              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Crafted for Every Workflow
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
                All Systems
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
            products={collectionProductsData?.items || []}
            categories={categories}
            loading={collectionLoading}
            onResetFilters={
              activeCollectionTab !== "all" ? () => setActiveCollectionTab("all") : undefined
            }
            columns={4}
          />
        </Container>
      </section>
    </div>
  );
}
