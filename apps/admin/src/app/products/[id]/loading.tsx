import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditProductLoading() {
  return (
    <PageContainer
      title="Edit Garment"
      description="Loading product specifications, pricing, inventory, variants and media..."
    >
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading garment form"
        className="space-y-6 animate-pulse max-w-5xl"
      >
        <span className="sr-only">Loading product details and form inputs...</span>

        {/* Header Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Basic Info Card */}
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-48 rounded-md border-b border-border/30 pb-3" />
          <div className="space-y-3">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Variants Card */}
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-40 rounded-md border-b border-border/30 pb-3" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((v) => (
              <div
                key={v}
                className="flex items-center justify-between py-2 border-b border-border/20 last:border-0"
              >
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
