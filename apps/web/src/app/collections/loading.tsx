import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionsListLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading curated collections"
      className="py-8 md:py-12 space-y-12"
    >
      <span className="sr-only">Loading seasonal lookbooks and collections...</span>
      <Container size="xl" className="space-y-10">
        {/* Breadcrumb Trail Placeholder */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded-md" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>

        {/* Hero Header Skeleton */}
        <div className="max-w-2xl space-y-3">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-10 w-72 rounded-2xl" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
          <Skeleton className="h-4 w-3/4 max-w-md rounded-md" />
        </div>

        {/* Collections Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="group overflow-hidden rounded-3xl border border-border/40 bg-card p-4 space-y-4 shadow-xs"
            >
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <div className="space-y-2 p-2">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-3.5 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
