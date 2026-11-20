import { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogApi } from "@/lib/api/catalog-api";
import { ProductDetailsClient } from "./product-details-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await catalogApi.getProduct(slug);
    if (!product) {
      return {
        title: "Product Not Found | Veyora",
      };
    }

    const firstImage = product.images?.[0]?.url;

    return {
      title: `${product.seo?.metaTitle || product.title} | Veyora Atelier`,
      description:
        product.seo?.metaDescription ||
        product.description.slice(0, 160) ||
        "Precision hardware crafted for modern creators by Veyora.",
      alternates: {
        canonical: `/products/${product.slug}`,
      },
      openGraph: {
        title: product.title,
        description: product.description.slice(0, 160),
        url: `/products/${product.slug}`,
        images: firstImage ? [{ url: firstImage }] : [],
        type: "website",
      },
    };
  } catch {
    return {
      title: "Product Details | Veyora Atelier",
      description: "Explore precision hardware crafted by Veyora Atelier.",
    };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  try {
    const product = await catalogApi.getProduct(slug);
    if (!product) {
      notFound();
    }
    return <ProductDetailsClient initialProduct={product} />;
  } catch {
    notFound();
  }
}
