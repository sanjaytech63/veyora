"use client";

import * as React from "react";
import { LoaderCircle, Shield } from "lucide-react";

interface AdminAuthLoadingScreenProps {
  message?: string;
  className?: string;
}

export function AdminAuthLoadingScreen({
  message = "Verifying administrator credentials...",
  className = "",
}: AdminAuthLoadingScreenProps) {
  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground ${className}`}
      data-testid="admin-auth-loading-screen"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div className="text-left">
          <span className="text-base font-semibold tracking-tight text-foreground block">
            Veyora Admin
          </span>
          <span className="text-xs text-muted-foreground">Console &amp; Operations</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 text-muted-foreground mt-3">
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        <p className="text-xs font-medium tracking-wide">{message}</p>
      </div>
    </div>
  );
}
