import type { Metadata } from "next";
import { ProductsListClient } from "./products-list-client";

export const metadata: Metadata = {
  title: "Garment Catalog",
  description:
    "Comprehensive apparel catalog, inventory levels, variant pricing, and SKU management.",
};

export default function AdminProductsPage() {
  return <ProductsListClient />;
}
