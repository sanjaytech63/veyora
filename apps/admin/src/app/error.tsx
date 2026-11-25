"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Home, ShieldAlert, LogIn, WifiOff, AlertCircle } from "lucide-react";
import { parseSafeAdminError } from "@/lib/error-utils";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    console.error("Admin App Router Caught Exception [digest: %s]:", error.digest || "none");
  }, [error]);

  const safeInfo = parseSafeAdminError(error);

  const renderIcon = () => {
    if (safeInfo.isAuthError || safeInfo.isForbidden) {
      return <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden="true" />;
    }
    if (safeInfo.isNetworkError) {
      return <WifiOff className="h-7 w-7 text-destructive" aria-hidden="true" />;
    }
    return <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />;
  };

  return (
    <main
      role="alert"
      aria-live="assertive"
      aria-labelledby="admin-error-heading"
      aria-describedby="admin-error-description"
      className="flex min-h-[70vh] items-center justify-center p-6 focus:outline-hidden"
    >
      <Card className="max-w-md w-full border-border/80 shadow-lg">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
            {renderIcon()}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            {safeInfo.isAuthError
              ? "Session Invalidation"
              : safeInfo.isForbidden
                ? "Access Denied"
                : safeInfo.isNetworkError
                  ? "Service Disconnected"
                  : "Console Interrupted"}
          </span>
          <CardTitle
            id="admin-error-heading"
            className="text-xl font-bold tracking-tight text-foreground"
          >
            {safeInfo.title}
          </CardTitle>
          <CardDescription
            id="admin-error-description"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {safeInfo.message}
          </CardDescription>
          {error.digest && (
            <p className="text-[10px] font-mono text-muted-foreground/70 pt-1">
              Diagnostic Digest: {error.digest}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {safeInfo.isAuthError ? (
            <Button
              asChild
              variant="default"
              size="sm"
              className="rounded-xl text-xs gap-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Link href="/login">
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                Sign In to Console
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => reset()}
              className="rounded-xl text-xs gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry Action
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Link href="/">
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              Executive Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
