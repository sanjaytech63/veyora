import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerOrderDetailClient } from "./order-detail-client";

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Order Details | Veyora Atelier",
  description: "Track shipment and inspect bespoke tailoring details for your atelier order.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) {
    notFound();
  }
  return <CustomerOrderDetailClient orderId={id} />;
}
