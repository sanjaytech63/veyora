"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Sparkles, ArrowRight, ArrowUpRight } from "lucide-react";
import { FASHION_COLLECTIONS } from "@/lib/constants/collections";

export default function CollectionsPage() {
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
          <span className="font-semibold text-foreground">Curated Collections</span>
        </nav>

        {/* Hero Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Seasonal Lookbooks</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Curated Collections
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Thoughtfully curated edits celebrating regional Indian heritage crafts, festive
            grandeur, and refined daily comfort.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FASHION_COLLECTIONS.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-foreground/30"
            >
              {/* Media Stage */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                <OptimizedImage
                  src={c.image}
                  alt={c.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                <div className="absolute left-5 right-5 top-5 flex items-center justify-between text-white">
                  <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur-md">
                    {c.season}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950 shadow-md transition-transform duration-300 group-hover:scale-110">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="absolute inset-x-5 bottom-5 space-y-1 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                    {c.tagline}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{c.title}</h2>
                </div>
              </div>

              {/* Description & Action */}
              <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {c.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-semibold text-primary">
                  <span>Explore Edit</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
