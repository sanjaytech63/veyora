import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="py-10 md:py-16">
      <Container size="xl">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-md" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-20 rounded-md" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Gallery Media Skeleton (Left) */}
          <div className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          </div>

          {/* Product Purchasing Dossier (Right) */}
          <div className="space-y-6 lg:py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-9 w-3/4 rounded-xl" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>

            <div className="space-y-2 border-y border-border/40 py-4">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>

            {/* Variant / Size Options */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-12 rounded-xl" />
                ))}
              </div>
            </div>

            {/* Buying Action Button */}
            <div className="pt-4 space-y-3">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
