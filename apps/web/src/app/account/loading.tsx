import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="py-10 md:py-16">
      <Container size="lg" className="space-y-8">
        {/* Account Header */}
        <div className="flex items-center gap-4 border-b border-border/40 pb-6">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
        </div>

        {/* Navigation Tabs Placeholder */}
        <div className="flex items-center gap-2 border-b border-border/30 pb-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-xl" />
          ))}
        </div>

        {/* Account Form / Card Placeholder */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 space-y-6">
          <div className="space-y-1 border-b border-border/30 pb-4">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-72 rounded-md" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((field) => (
              <div key={field} className="space-y-2">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </Container>
    </div>
  );
}
