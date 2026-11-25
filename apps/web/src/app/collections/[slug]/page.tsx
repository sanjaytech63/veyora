import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedCollectionBySlug } from "@/lib/cache/catalog-cache";
import { CollectionClient } from "./collection-client";
import { CollectionPageJsonLd, BreadcrumbJsonLd } from "@/components/storefront/json-ld";
import { siteConfig, getCanonicalUrl } from "@/config/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCachedCollectionBySlug(slug);

  if (!collection) {
    return {
      title: "Collection Not Found",
      description: "The requested curated collection could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = getCanonicalUrl(`/collections/${collection.slug}`);
  const metaTitle = `${collection.name} | Curated Collections`;
  const metaDescription =
    collection.description ||
    collection.tagline ||
    `Explore ${collection.name} lookbook and handcrafted ensembles on ${siteConfig.brandName}.`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${collection.name} | ${siteConfig.brandName}`,
      description: metaDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: collection.image
        ? [{ url: collection.image, alt: collection.name, width: 1200, height: 630 }]
        : [{ url: siteConfig.ogImage, alt: collection.name, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${collection.name} | ${siteConfig.brandName}`,
      description: metaDescription,
      images: collection.image ? [collection.image] : [siteConfig.ogImage],
      creator: "@veyora",
    },
  };
}

export default async function SingleCollectionPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const collection = await getCachedCollectionBySlug(slug);
  if (!collection) {
    notFound();
  }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Collections", url: "/collections" },
    { name: collection.name, url: `/collections/${collection.slug}` },
  ];

  return (
    <>
      <CollectionPageJsonLd collection={collection} url={`/collections/${collection.slug}`} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CollectionClient initialCollection={collection} />
    </>
  );
}
