import { Container } from "@/components/ui/container";

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading atelier resources"
      className="py-20 md:py-32"
    >
      <Container
        size="xl"
        className="space-y-8 flex flex-col items-center justify-center text-center"
      >
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Veyora Atelier
          </p>
          <p className="text-xs text-muted-foreground/80">Loading atelier resources...</p>
          <span className="sr-only">Please wait, loading atelier resources...</span>
        </div>
      </Container>
    </div>
  );
}
