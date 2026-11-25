import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main
      role="region"
      aria-labelledby="not-found-heading"
      aria-describedby="not-found-desc"
      className="py-24 md:py-36 focus:outline-hidden"
    >
      <Container size="sm" className="text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/60 text-primary border border-border/60 shadow-xs">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Error 404
          </span>
          <h1
            id="not-found-heading"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground"
          >
            Page Not Located
          </h1>
          <p
            id="not-found-desc"
            className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed"
          >
            The atelier garment, collection lookbook, or resource you requested cannot be found or
            may have been retired.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            variant="default"
            size="sm"
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Link href="/" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Link href="/shop">Browse Catalog</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
