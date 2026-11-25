import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrdersLoading() {
  return (
    <PageContainer
      title="Order Fulfillment Ledger"
      description="Loading customer purchases, consignment statuses, and payments..."
    >
      <div className="space-y-6">
        {/* Order Status Tabs */}
        <div className="flex items-center gap-2 border-b border-border/30 pb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-72 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Orders Table Rows */}
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 py-3 border-b border-border/20 last:border-0"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-40 rounded-md" />
              </div>
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
