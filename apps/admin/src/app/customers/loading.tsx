import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCustomersLoading() {
  return (
    <PageContainer
      title="Patron Registry"
      description="Loading patron dossiers, telemetry metrics, and acquisition cohorts..."
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-72 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        {/* Customers Table */}
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 py-2.5 border-b border-border/20 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-48 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
