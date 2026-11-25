import * as React from "react";
import type { Metadata } from "next";
import { NotificationDetailClient } from "./notification-detail-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

export const instant = false;

interface PageProps {
  params: Promise<{ notificationId: string }>;
}

export const metadata: Metadata = {
  title: "Notice Details | Veyora",
  description: "View full atelier notification details and context.",
};

async function NotificationDetailContent({
  params,
}: {
  params: Promise<{ notificationId: string }>;
}) {
  const { notificationId } = await params;
  return <NotificationDetailClient notificationId={notificationId} />;
}

export default function NotificationDetailPage({ params }: PageProps) {
  return (
    <React.Suspense
      fallback={
        <Container size="md" className="py-12 space-y-6">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </Container>
      }
    >
      <NotificationDetailContent params={params} />
    </React.Suspense>
  );
}
