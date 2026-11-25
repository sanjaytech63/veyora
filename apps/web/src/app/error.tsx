"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, RefreshCw, LogIn, ShieldAlert, WifiOff } from "lucide-react";
import { parseSafeError } from "@/lib/error-utils";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log unexpected client-side error telemetry without exposing sensitive data
    console.error("App Router Caught Exception [digest: %s]:", error.digest || "none");
  }, [error]);

  const safeInfo = parseSafeError(error);

  const renderIcon = () => {
    if (safeInfo.isAuthError || safeInfo.isForbidden) {
      return <ShieldAlert className="h-8 w-8" aria-hidden="true" />;
    }
    if (safeInfo.isNetworkError) {
      return <WifiOff className="h-8 w-8" aria-hidden="true" />;
    }
    return <AlertCircle className="h-8 w-8" aria-hidden="true" />;
  };

  return (
    <main
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-heading"
      aria-describedby="error-description"
      className="py-24 md:py-36 focus:outline-hidden"
    >
      <Container size="sm" className="text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
          {renderIcon()}
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            {safeInfo.isAuthError
              ? "Authentication Required"
              : safeInfo.isForbidden
                ? "Permission Denied"
                : safeInfo.isNetworkError
                  ? "Network Offline"
                  : "Application Exception"}
          </span>
          <h1
            id="error-heading"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground"
          >
            {safeInfo.title}
          </h1>
          <p
            id="error-description"
            className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed"
          >
            {safeInfo.message}
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-muted-foreground/70 pt-1">
              Diagnostic Digest: {error.digest}
            </p>
          )}
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {safeInfo.isAuthError ? (
            <Button
              asChild
              variant="default"
              size="sm"
              className="rounded-xl inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-1" aria-hidden="true" />
                Sign In to Atelier
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => reset()}
              className="rounded-xl inline-flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
              Try Again
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Link href="/" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return Home
            </Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
