import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="py-10 md:py-16">
      <Container size="xl" className="space-y-8">
        {/* Header Breadcrumb & Title Placeholder */}
        <div className="space-y-3 border-b border-border/40 pb-6">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>

        {/* Filter Bar & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        {/* Product Cards Grid (4 columns on lg) */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
            <div key={card} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md font-semibold" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
