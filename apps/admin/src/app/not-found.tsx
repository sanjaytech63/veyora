import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Compass } from "lucide-react";

export default function AdminNotFound() {
  return (
    <main
      role="region"
      aria-labelledby="admin-not-found-heading"
      aria-describedby="admin-not-found-desc"
      className="flex min-h-[70vh] items-center justify-center p-6 focus:outline-hidden"
    >
      <Card className="max-w-md w-full border-border/80 shadow-lg text-center">
        <CardHeader className="space-y-2 pb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/80 shadow-xs">
            <Compass className="h-7 w-7" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Error 404
          </span>
          <CardTitle
            id="admin-not-found-heading"
            className="text-xl font-bold tracking-tight text-foreground"
          >
            Administrative Resource Not Located
          </CardTitle>
          <CardDescription
            id="admin-not-found-desc"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            The requested console route, administrative resource, or entity record does not exist or
            may have been archived.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-3 pt-2">
          <Button
            asChild
            size="sm"
            className="rounded-xl text-xs gap-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Return to Executive Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
