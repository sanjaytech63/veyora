import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerDetailClient } from "./customer-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Patron Dossier",
  description: "Comprehensive customer profile, activity timeline, and order history.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || typeof id !== "string" || id.trim() === "") {
    notFound();
  }
  return <CustomerDetailClient customerId={id.trim()} />;
}
