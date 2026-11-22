import * as React from "react";
import { Metadata } from "next";
import { SearchClient } from "./search-client";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veyora.store";
  const title = q ? `Search: "${q}" | Veyora Atelier` : "Search Catalog | Veyora Atelier";
  const canonicalUrl = q ? `/search?q=${encodeURIComponent(q)}` : "/search";

  return {
    title,
    description: q
      ? `Search results for "${q}" across precision hardware, acoustic listening gear, and minimal couture at Veyora Atelier.`
      : "Search precision hardware, acoustic listening gear, and desk instruments crafted by Veyora.",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: `Explore discoverable catalog results for hardware and apparel on Veyora.`,
      url: `${siteUrl}${canonicalUrl}`,
      type: "website",
    },
    robots: {
      index: !q,
      follow: true,
    },
  };
}

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        </div>
      }
    >
      <SearchClient />
    </React.Suspense>
  );
}
