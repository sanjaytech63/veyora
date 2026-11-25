import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerDetailLoading() {
  return (
    <PageContainer
      title="Patron Dossier"
      description="Consulting patron profile, activity timeline, and order history..."
    >
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading customer record"
        className="space-y-6 animate-pulse"
      >
        <span className="sr-only">Loading patron profile dossier...</span>

        {/* Profile Header Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-4 w-64 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          ))}
        </div>

        {/* Detail Tabs or Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
              <Skeleton className="h-5 w-40 rounded-md border-b border-border/30 pb-3" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((r) => (
                  <div
                    key={r}
                    className="flex items-center justify-between py-2 border-b border-border/20 last:border-0"
                  >
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
              <Skeleton className="h-5 w-32 rounded-md border-b border-border/30 pb-3" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
