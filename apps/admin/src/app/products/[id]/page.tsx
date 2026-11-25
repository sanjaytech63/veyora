import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditProductClient } from "./edit-product-client";
import { serverAdminApi } from "@/lib/api/server-api-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await serverAdminApi.getProduct(id);
    return {
      title: product ? `Edit: ${product.title}` : "Edit Garment",
      description: "Modify product specifications, pricing, inventory, variants and media.",
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch {
    return {
      title: "Edit Garment",
      description: "Modify product specifications, pricing, inventory, variants and media.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || typeof id !== "string" || id.trim() === "") {
    notFound();
  }
  return <EditProductClient productId={id.trim()} />;
}
