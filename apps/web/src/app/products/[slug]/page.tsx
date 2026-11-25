import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServerApiClientError } from "@/lib/api/server-api-client";
import { getCachedProductBySlug } from "@/lib/cache/catalog-cache";
import { ProductDetailsClient } from "./product-details-client";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/storefront/json-ld";
import { siteConfig, getCanonicalUrl } from "@/config/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getCachedProductBySlug(slug);
    if (!product) {
      return {
        title: "Product Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const firstImage = product.images?.[0]?.url;
    const canonicalUrl = getCanonicalUrl(`/products/${product.slug}`);
    const metaTitle = product.seo?.metaTitle || product.title;
    const metaDescription =
      product.seo?.metaDescription ||
      (product.description ? product.description.slice(0, 160) : "") ||
      `Discover ${product.title} on ${siteConfig.brandName}. ${siteConfig.tagline}`;

    return {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${metaTitle} | ${siteConfig.brandName}`,
        description: metaDescription,
        url: canonicalUrl,
        siteName: siteConfig.name,
        images: firstImage
          ? [
              {
                url: firstImage,
                alt: product.title,
                width: 1200,
                height: 630,
              },
            ]
          : [
              {
                url: siteConfig.ogImage,
                alt: `${siteConfig.brandName} — ${product.title}`,
                width: 1200,
                height: 630,
              },
            ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${metaTitle} | ${siteConfig.brandName}`,
        description: metaDescription,
        images: firstImage ? [firstImage] : [siteConfig.ogImage],
        creator: "@veyora",
      },
    };
  } catch {
    return {
      title: "Product Details",
      description: `Explore modern fashion & curated apparel on ${siteConfig.brandName}.`,
    };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let product;
  try {
    product = await getCachedProductBySlug(slug);
  } catch (err: unknown) {
    if (
      err instanceof ServerApiClientError &&
      (err.statusCode === 404 || err.code === "NOT_FOUND" || err.isNotFound())
    ) {
      notFound();
    }
    // Rethrow ordinary server/network errors to be handled by App Router error boundary
    throw err;
  }

  if (!product) {
    notFound();
  }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    {
      name: product.category?.name || "Catalog",
      url: product.category ? `/category/${product.category.slug}` : "/shop",
    },
    { name: product.title, url: `/products/${product.slug}` },
  ];

  return (
    <>
      <ProductJsonLd product={product} url={`/products/${product.slug}`} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ProductDetailsClient initialProduct={product} />
    </>
  );
}
