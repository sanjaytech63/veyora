/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Product, Category, Collection } from "@veyora/types";
import { siteConfig, getCanonicalUrl } from "@/config/site";

/**
 * Serializes data into a safe JSON string for injection into <script type="application/ld+json">.
 * Escapes `<` to `\u003c` to prevent HTML/XSS script breakout attacks.
 */
export function safeJsonLdReplacer(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Organization Structured Data (JSON-LD)
 * Represents the Veyora brand and corporate entity.
 */
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.brandName,
    alternateName: ["Veyora Store", "Veyora Fashion"],
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    slogan: siteConfig.tagline,
    description: siteConfig.description,
    sameAs: [siteConfig.links.twitter, siteConfig.links.instagram],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(schema) }}
    />
  );
}

/**
 * WebSite Structured Data (JSON-LD)
 * Enables Sitelinks Searchbox in Google search results.
 */
export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: ["Veyora Storefront", "Veyora E-Commerce"],
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(schema) }}
    />
  );
}

interface ProductJsonLdProps {
  product: Product;
  url?: string;
}

/**
 * Product Structured Data (JSON-LD)
 * Enhances search results with rich product snippets, price, availability, and real ratings.
 * Strictly uses real API data — never fabricates reviews or ratings.
 */
export function ProductJsonLd({ product, url }: ProductJsonLdProps) {
  const canonicalUrl = url ? getCanonicalUrl(url) : getCanonicalUrl(`/products/${product.slug}`);

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
      name: product.brand?.name || siteConfig.brandName,
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "INR",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: siteConfig.brandName,
      },
    },
  };

  // Only include aggregateRating if real rating data exists on the product
  if (
    typeof product.reviewCount === "number" &&
    product.reviewCount > 0 &&
    typeof product.averageRating === "number" &&
    product.averageRating > 0
  ) {
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
      dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(schema) }}
    />
  );
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

/**
 * BreadcrumbList Structured Data (JSON-LD)
 * Enables breadcrumb navigation paths in search engine listings.
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.url),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(schema) }}
    />
  );
}

interface CollectionPageJsonLdProps {
  category?: Category;
  collection?: Collection;
  url: string;
  products?: Product[];
}

/**
 * CollectionPage Structured Data (JSON-LD)
 * Represents catalog categories and curated collections.
 */
export function CollectionPageJsonLd({
  category,
  collection,
  url,
  products = [],
}: CollectionPageJsonLdProps) {
  const canonicalUrl = getCanonicalUrl(url);
  const name =
    collection?.name || (category?.name ? `${category.name} Collection` : "Curated Collection");
  const description =
    collection?.description ||
    collection?.tagline ||
    category?.description ||
    `Browse curated apparel on ${siteConfig.brandName}.`;

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${name} | ${siteConfig.brandName}`,
    description,
    url: canonicalUrl,
  };

  if (products.length > 0) {
    schema["mainEntity"] = {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 12).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: getCanonicalUrl(`/products/${p.slug}`),
        name: p.title,
      })),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdReplacer(schema) }}
    />
  );
}
