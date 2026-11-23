import type { Metadata } from "next";
import { NotificationDetailClient } from "./notification-detail-client";

interface PageProps {
  params: Promise<{ notificationId: string }>;
}

export const metadata: Metadata = {
  title: "Notice Details | Veyora",
  description: "View full atelier notification details and context.",
};

export default async function NotificationDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <NotificationDetailClient notificationId={resolvedParams.notificationId} />;
}
