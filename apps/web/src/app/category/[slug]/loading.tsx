import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="py-10 md:py-16">
      <Container size="xl" className="space-y-8">
        {/* Category Hero Banner Skeleton */}
        <div className="rounded-3xl border border-border/40 bg-muted/20 p-8 md:p-12 space-y-4">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-10 w-72 rounded-2xl" />
          <Skeleton className="h-4 w-full max-w-lg rounded-md" />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
            <div key={card} className="space-y-3">
              <Skeleton className="aspect-3/4 w-full rounded-2xl" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-20 rounded-md" />
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
