import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InventoryDetailClient } from "./inventory-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Inventory Stock Ledger",
  description:
    "Real-time stock balance, low-stock threshold configuration, and movement audit history.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function InventoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || typeof id !== "string" || id.trim() === "") {
    notFound();
  }
  return <InventoryDetailClient skuOrId={id.trim()} />;
}
