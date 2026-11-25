import type { Metadata } from "next";
import * as React from "react";
import { Container } from "@/components/ui/container";
import { LoaderCircle } from "lucide-react";
import { ShopClient } from "./shop-client";
import { siteConfig, getCanonicalUrl } from "@/config/site";
import { BreadcrumbJsonLd } from "@/components/storefront/json-ld";

export const metadata: Metadata = {
  title: "Shop All Collections",
  description:
    "Explore our complete catalog of contemporary apparel, timeless wardrobe essentials, and designer garments. Shop smarter, live better with Veyora.",
  alternates: {
    canonical: getCanonicalUrl("/shop"),
  },
  openGraph: {
    title: `Shop All Collections | ${siteConfig.brandName}`,
    description:
      "Explore our complete catalog of contemporary apparel, timeless wardrobe essentials, and designer garments on Veyora.",
    url: getCanonicalUrl("/shop"),
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.brandName} Shop`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Shop All Collections | ${siteConfig.brandName}`,
    description:
      "Explore our complete catalog of contemporary apparel, timeless wardrobe essentials, and designer garments on Veyora.",
    images: [siteConfig.ogImage],
    creator: "@veyora",
  },
};

export default function ShopPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <React.Suspense
        fallback={
          <div className="py-24 text-center">
            <Container size="xl" className="space-y-4 flex flex-col items-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading catalog...</p>
            </Container>
          </div>
        }
      >
        <ShopClient />
      </React.Suspense>
    </>
  );
}
