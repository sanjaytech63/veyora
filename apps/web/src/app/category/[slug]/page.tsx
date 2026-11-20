import { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogApi } from "@/lib/api/catalog-api";
import { CategoryClient } from "./category-client";

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
    title: `${category.name} | Veyora Atelier Collection`,
    description: category.description || `Browse curated ${category.name} instruments and hardware on Veyora.`,
    openGraph: {
      title: `${category.name} | Veyora`,
      description: category.description || `Browse ${category.name} hardware on Veyora.`,
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

  return <CategoryClient initialCategory={category} />;
}
