import { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogApi } from "@/lib/api/catalog-api";
import { CategoryClient } from "./category-client";
import { CollectionPageJsonLd, BreadcrumbJsonLd } from "@/components/storefront/json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await catalogApi.getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | Veyora Atelier",
      description: "The requested department could not be found.",
    };
  }

  return {
    title: `${category.name} | Veyora Haute Couture Collection`,
    description:
      category.description ||
      `Browse curated ${category.name} designs and apparel on Veyora Atelier.`,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | Veyora Atelier`,
      description:
        category.description ||
        `Browse curated ${category.name} apparel on Veyora Atelier.`,
      url: `/category/${category.slug}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await catalogApi.getCategoryBySlug(slug);

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
