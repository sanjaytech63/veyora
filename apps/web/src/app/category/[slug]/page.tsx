import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedCategoryBySlug } from "@/lib/cache/catalog-cache";
import { CategoryClient } from "./category-client";
import { CollectionPageJsonLd, BreadcrumbJsonLd } from "@/components/storefront/json-ld";
import { siteConfig, getCanonicalUrl } from "@/config/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCachedCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = getCanonicalUrl(`/category/${category.slug}`);
  const metaTitle = `${category.name} | Category`;
  const metaDescription =
    category.description ||
    `Browse curated ${category.name} apparel and contemporary designs on ${siteConfig.brandName}. ${siteConfig.tagline}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name} | ${siteConfig.brandName}`,
      description: metaDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "website",
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${category.name} on ${siteConfig.brandName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | ${siteConfig.brandName}`,
      description: metaDescription,
      images: [siteConfig.ogImage],
      creator: "@veyora",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCachedCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: category.name, url: `/category/${category.slug}` },
  ];

  return (
    <>
      <CollectionPageJsonLd category={category} url={`/category/${category.slug}`} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CategoryClient initialCategory={category} />
    </>
  );
}
