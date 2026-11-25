import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

export default function NotificationDetailLoading() {
  return (
    <Container size="md" className="py-12 space-y-6">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </Container>
  );
}
