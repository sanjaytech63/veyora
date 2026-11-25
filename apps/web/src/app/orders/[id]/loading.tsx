import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading order telemetry"
      className="py-10 md:py-16 space-y-8"
    >
      <span className="sr-only">Loading order details and fulfillment timeline...</span>
      <Container size="xl" className="space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-44 rounded-xl" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-40 rounded-md" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>

        {/* Status Stepper Skeleton */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <Skeleton className="h-4 w-36 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Purchased Garments */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <div className="space-y-4 pt-2">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 py-2 border-b border-border/20 last:border-0"
                  >
                    <Skeleton className="h-20 w-16 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-44 rounded-md" />
                      <Skeleton className="h-3 w-28 rounded-md" />
                      <Skeleton className="h-3.5 w-16 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery & Summary Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <Skeleton className="h-5 w-36 rounded-md border-b border-border/40 pb-3" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-4/5 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
