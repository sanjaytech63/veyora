import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionLoading() {
  return (
    <div className="py-10 md:py-16">
      <Container size="xl" className="space-y-8">
        {/* Curated Collection Hero Header Skeleton */}
        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-muted/30 p-8 md:p-16 space-y-4">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-12 w-80 rounded-2xl" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>

        {/* Curated Collection Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
            <div key={card} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
