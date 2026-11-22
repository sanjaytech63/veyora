"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

interface AuthLoadingScreenProps {
  message?: string;
  className?: string;
}

export function AuthLoadingScreen({
  message = "Restoring session...",
  className = "",
}: AuthLoadingScreenProps) {
  return (
    <div
      className={`flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center ${className}`}
      data-testid="auth-loading-screen"
    >
      <div className="flex flex-col items-center gap-2">
        <span className="font-heading tracking-widest text-lg font-light uppercase text-foreground">
          Veyora
        </span>
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
          Atelier &amp; Goods
        </span>
      </div>
      <div className="flex items-center gap-2.5 text-muted-foreground mt-2">
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        <p className="text-xs font-light tracking-wide">{message}</p>
      </div>
    </div>
  );
}
