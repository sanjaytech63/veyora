import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ProductGrid } from "@/components/storefront/product-grid";
import { HeroCarousel } from "@/components/home/hero-carousel";
import {
  getCachedCategories,
  getCachedFeaturedProducts,
  getCachedProducts,
} from "@/lib/cache/catalog-cache";
import { ArrowRight, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { Category, Product } from "@veyora/types";

export const metadata: Metadata = {
  title: "Veyora — Premium Indian Fashion",
  description:
    "Discover contemporary Indian fashion, curated kurtis, and refined occasionwear from Veyora.",
};

export default async function StorefrontHomePage() {
  let categories: Category[] = [];
  let featuredProducts: Product[] = [];
  let collectionProducts: Product[] = [];

  await Promise.allSettled([
    getCachedCategories(),
    getCachedFeaturedProducts(5),
    getCachedProducts({ limit: 10 }),
  ]).then(([categoryResult, featuredResult, productResult]) => {
    if (categoryResult.status === "fulfilled") categories = categoryResult.value || [];
    if (featuredResult.status === "fulfilled") featuredProducts = featuredResult.value || [];
    if (productResult.status === "fulfilled") collectionProducts = productResult.value || [];
  });

  const heroProducts = featuredProducts.length ? featuredProducts : collectionProducts.slice(0, 3);
  const topPicks = featuredProducts.length ? featuredProducts : collectionProducts.slice(0, 5);
  const activeCategory =
    categories.find((category) => category.status === "active") ?? categories[0];

  return (
    <div className="pb-16">
      <HeroCarousel products={heroProducts} />

      {activeCategory ? (
        <section className="border-b border-border/60 bg-card/50 py-5">
          <Container size="xl">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={`/category/${activeCategory.slug}`}
                className="group flex min-w-0 flex-1 items-center gap-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:h-20 sm:w-20">
                  {activeCategory ? (
                    <OptimizedImage
                      src="/veyora-kurti-primary.jpg"
                      fallbackSrc="/veyora-kurti-primary.jpg"
                      alt={activeCategory.name}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {activeCategory.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {activeCategory.description || "Explore the available collection"}
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="py-12 sm:py-16">
        <Container size="xl" className="space-y-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Trending Now
              </p>
              <h2 className="mt-2 text-3xl font-medium tracking-tight text-foreground sm:text-[38px]">
                Our Top Picks
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden items-center gap-1.5 text-xs font-semibold text-primary sm:flex"
            >
              View All Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ProductGrid
            products={topPicks}
            categories={categories}
            columns={5}
            emptyTitle="No featured garments available"
            emptyDescription="New Veyora products will appear here when they are published."
          />

          <Link
            href="/shop"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary sm:hidden"
          >
            View All Products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Container>
      </section>

      {activeCategory ? (
        <section className="pb-12 sm:pb-16">
          <Container size="xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Link
                href="/new-arrivals"
                className="group relative min-h-[220px] overflow-hidden rounded-md border border-border/70 bg-card"
              >
                {topPicks[0] ? (
                  <OptimizedImage
                    src="/veyora-kurti-festive.jpg"
                    fallbackSrc="/veyora-kurti-primary.jpg"
                    alt="Festive fashion selection"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
                <div className="relative z-10 max-w-[220px] px-7 py-8 sm:px-10 sm:py-10">
                  <p className="text-[26px] leading-[1.05] font-medium text-foreground">
                    Festive Edit
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Explore current arrivals</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Shop Now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              <Link
                href={`/category/${activeCategory.slug}`}
                className="group relative min-h-[220px] overflow-hidden rounded-md border border-border/70 bg-card"
              >
                {activeCategory ? (
                  <OptimizedImage
                    src="/veyora-kurti-detail.jpg"
                    fallbackSrc="/veyora-kurti-primary.jpg"
                    alt={activeCategory.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/65 to-transparent" />
                <div className="relative z-10 max-w-[260px] px-7 py-8 sm:px-10 sm:py-10">
                  <p className="text-[26px] leading-[1.05] font-medium text-foreground">
                    Handcrafted
                    <br />
                    with Heritage
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Discover timeless elegance</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Explore Collection
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-y border-border/60 bg-card/40 py-6">
        <Container size="xl">
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              { icon: Truck, title: "Free Shipping", text: "On qualifying orders" },
              { icon: ShieldCheck, title: "Secure Payments", text: "Protected checkout" },
              { icon: RotateCcw, title: "Easy Returns", text: "Clear return options" },
              { icon: Sparkles, title: "Premium Quality", text: "Carefully selected fabrics" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container size="xl">
          <div className="flex flex-col items-start justify-between gap-5 border-b border-border/70 pb-8 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Veyora Newsletter
              </p>
              <h2 className="mt-2 text-3xl font-medium tracking-tight text-foreground">
                Stay in Style
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Get exclusive offers and style updates.
              </p>
            </div>
            <Button asChild variant="outline" className="h-11 rounded-sm px-6 text-xs">
              <Link href="/shop">Explore the Collection</Link>
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
