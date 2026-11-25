import * as React from "react";
import { Metadata } from "next";
import { SearchClient } from "./search-client";
import { siteConfig, getCanonicalUrl } from "@/config/site";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `Search: "${q}"` : "Search Catalog";

  return {
    title,
    description: q
      ? `Search results for "${q}" on ${siteConfig.brandName}. ${siteConfig.tagline}`
      : `Search curated fashion and apparel on ${siteConfig.brandName}.`,
    alternates: {
      canonical: getCanonicalUrl("/search"),
    },
    // Search pages must NEVER be indexed to avoid duplicate content and crawler traps
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
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
