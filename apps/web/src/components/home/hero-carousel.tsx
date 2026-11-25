"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Play } from "lucide-react";
import { Product } from "@veyora/types";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroCarousel({ products }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const touchStart = React.useRef<number | null>(null);
  const slides = products.filter((product) => product.images?.[0]?.url).slice(0, 3);

  const move = React.useCallback(
    (direction: -1 | 1) => {
      if (slides.length < 2) return;
      setActiveIndex((current) => (current + direction + slides.length) % slides.length);
    },
    [slides.length]
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  const activeProduct = slides[activeIndex];
  const activeImage = activeProduct?.images?.[0]?.url;

  return (
    <section
      aria-label="Veyora festive campaign"
      className="overflow-hidden border-b border-border/70 bg-[hsl(var(--background))]"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const end = event.changedTouches[0]?.clientX ?? touchStart.current;
        const distance = end - touchStart.current;
        if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
        touchStart.current = null;
      }}
    >
      <div className="mx-auto grid min-h-[430px] max-w-[1400px] grid-cols-1 lg:grid-cols-[46%_54%]">
        <div className="relative z-10 flex items-center px-6 py-14 sm:px-10 lg:px-16 xl:px-20">
          <div className="max-w-[520px]">
            <p className="mb-5 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              The Festive Edit 2026
            </p>
            <h1 className="font-editorial text-[43px] font-medium leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[58px] lg:text-[64px]">
              Heritage Craft,
              <br />
              <span className="italic text-primary">Modern Elegance</span>
            </h1>
            <p className="mt-6 max-w-[470px] text-sm leading-6 text-muted-foreground sm:text-[15px]">
              Handwoven silks, pure cottons and regal prints — Indian ethnic wear for every
              celebration.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild className="h-11 rounded-sm px-6 text-xs font-semibold">
                <Link href="/shop" className="gap-2">
                  Explore Collection
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {activeProduct ? (
                <Button
                  asChild
                  variant="ghost"
                  className="h-11 rounded-sm px-4 text-xs font-semibold"
                >
                  <Link href={`/products/${activeProduct.slug}`} className="gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border">
                      <Play className="h-3 w-3 fill-current" />
                    </span>
                    View Garment
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative min-h-[380px] overflow-hidden bg-muted lg:min-h-[430px]">
          {activeProduct && activeImage ? (
            <>
              <OptimizedImage
                src="/veyora-kurti-primary.jpg"
                fallbackSrc="/veyora-kurti-primary.jpg"
                showLoader={false}
                alt={activeProduct.title}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 54vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/10 via-transparent to-transparent" />
              <Link
                href={`/products/${activeProduct.slug}`}
                aria-label={`View ${activeProduct.title}`}
                className="absolute bottom-5 right-5 flex h-11 items-center gap-2 rounded-full border border-white/30 bg-black/55 px-4 text-xs font-semibold text-white backdrop-blur-md transition-colors duration-150 hover:bg-black/75"
              >
                <span className="max-w-36 truncate">{activeProduct.title}</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.35),transparent_45%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]" />
          )}

          {slides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous campaign"
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/60"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next campaign"
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/60"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Go to campaign ${index + 1}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    className={cn(
                      "h-1.5 rounded-full bg-white/70 transition-all",
                      index === activeIndex ? "w-5" : "w-1.5"
                    )}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
