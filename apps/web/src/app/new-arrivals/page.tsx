import type { Metadata } from "next";
import * as React from "react";
import NewArrivalsClient from "./new-arrivals-client";
import { siteConfig, getCanonicalUrl } from "@/config/site";
import { BreadcrumbJsonLd } from "@/components/storefront/json-ld";

export const metadata: Metadata = {
  title: "New Arrivals",
  description:
    "Discover the latest season releases, modern silhouettes, and freshly tailored fashion essentials on Veyora.",
  alternates: {
    canonical: getCanonicalUrl("/new-arrivals"),
  },
  openGraph: {
    title: `New Arrivals | ${siteConfig.brandName}`,
    description:
      "Discover the latest season releases, modern silhouettes, and freshly tailored fashion essentials on Veyora.",
    url: getCanonicalUrl("/new-arrivals"),
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.brandName} New Arrivals`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `New Arrivals | ${siteConfig.brandName}`,
    description:
      "Discover the latest season releases, modern silhouettes, and freshly tailored fashion essentials on Veyora.",
    images: [siteConfig.ogImage],
    creator: "@veyora",
  },
};

export default function NewArrivalsPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "New Arrivals", url: "/new-arrivals" },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <NewArrivalsClient />
    </>
  );
}
