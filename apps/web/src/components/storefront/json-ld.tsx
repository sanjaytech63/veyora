/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Product, Category } from "@veyora/types";

interface ProductJsonLdProps {
  product: Product;
  url: string;
}

export function ProductJsonLd({ product, url }: ProductJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veyora.store";
  const canonicalUrl = url.startsWith("http")
    ? url
    : `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images?.map((img) => img.url) || [],
    sku: product.sku,
    category: product.category?.name,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || "Veyora Atelier",
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "USD",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (product.reviewCount && product.reviewCount > 0 && product.averageRating) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veyora.store";

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const fullUrl = item.url.startsWith("http")
        ? item.url
        : `${siteUrl}${item.url.startsWith("/") ? item.url : `/${item.url}`}`;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface CollectionPageJsonLdProps {
  category: Category;
  url: string;
  products?: Product[];
}

export function CollectionPageJsonLd({ category, url, products = [] }: CollectionPageJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veyora.store";
  const canonicalUrl = url.startsWith("http")
    ? url
    : `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Collection | Veyora Atelier`,
    description: category.description || `Browse curated ${category.name} on Veyora Atelier.`,
    url: canonicalUrl,
  };

  if (products.length > 0) {
    schema["mainEntity"] = {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 10).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${siteUrl}/products/${p.slug}`,
        name: p.title,
      })),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veyora.store";

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Veyora Atelier",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
