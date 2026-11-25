import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInventoryLoading() {
  return (
    <PageContainer
      title="Inventory Ledger"
      description="Fetching stock balances, warehouse reservations, and movement trails..."
    >
      <div className="space-y-6">
        {/* Stock Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          ))}
        </div>

        {/* Filter Input */}
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-72 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>

        {/* Inventory SKU Matrix Table */}
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 py-2.5 border-b border-border/20 last:border-0"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-44 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
