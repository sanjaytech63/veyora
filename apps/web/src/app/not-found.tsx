import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="py-24 md:py-36">
      <Container size="sm" className="text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/60 text-primary border border-border/60">
          <Compass className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Error 404
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Page Not Located
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The atelier item, department, or resource you requested cannot be found or may have been
            archived.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button asChild variant="default" size="sm" className="rounded-xl">
            <Link href="/" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/shop">Browse Catalog</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
