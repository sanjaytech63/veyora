import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="py-10 md:py-16">
      <Container size="lg" className="space-y-8">
        {/* Orders Header */}
        <div className="space-y-2 border-b border-border/40 pb-6">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>

        {/* Order Cards Placeholders */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/30 pb-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="flex items-center gap-4 py-2">
                <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-3.5 w-16 rounded-md font-semibold" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
