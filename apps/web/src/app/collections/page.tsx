import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getCachedCollections } from "@/lib/cache/catalog-cache";
import { Collection } from "@veyora/types";
import { Sparkles, ArrowRight, ArrowUpRight } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/storefront/json-ld";
import { siteConfig, getCanonicalUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Curated Collections",
  description:
    "Thoughtfully curated edits celebrating regional Indian heritage crafts, festive grandeur, and refined daily comfort.",
  alternates: {
    canonical: getCanonicalUrl("/collections"),
  },
  openGraph: {
    title: `Curated Collections | ${siteConfig.brandName}`,
    description:
      "Explore curated fashion edits, seasonal lookbooks, and designer garments on Veyora.",
    url: getCanonicalUrl("/collections"),
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.brandName} Curated Collections`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Curated Collections | ${siteConfig.brandName}`,
    description:
      "Explore curated fashion edits, seasonal lookbooks, and designer garments on Veyora.",
    images: [siteConfig.ogImage],
    creator: "@veyora",
  },
};

export default async function CollectionsPage() {
  let collections: Collection[] = [];
  try {
    collections = await getCachedCollections();
  } catch {
    collections = [];
  }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Curated Collections", url: "/collections" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
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

          {collections.length === 0 ? (
            <div className="py-16 rounded-3xl border border-dashed border-border/80 bg-muted/20">
              <EmptyState
                icon={<Sparkles className="h-8 w-8 text-muted-foreground" />}
                title="No collections published"
                description="Our ateliers are preparing upcoming capsule releases and lookbooks. Check back shortly."
                action={
                  <Button asChild className="rounded-full px-6 text-xs font-semibold">
                    <Link href="/shop" className="inline-flex items-center gap-2">
                      <span>Explore Catalog</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/30">
                    {c.image ? (
                      <OptimizedImage
                        src={c.image}
                        alt={c.name}
                        fill
                        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/60 to-muted">
                        <span className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
                          Veyora Atelier
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 text-white space-y-1.5">
                      {c.tagline && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 block">
                          {c.tagline}
                        </span>
                      )}
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-between">
                        <span>{c.name}</span>
                        <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
                      </h2>
                    </div>
                  </div>
                  {c.description && (
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                        <span>View Ensembles</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </div>
    </>
  );
}
