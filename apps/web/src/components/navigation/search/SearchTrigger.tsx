"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchTriggerProps } from "./search.types";

export function SearchTrigger({ onClick, className, variant = "pill" }: SearchTriggerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClick?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClick]);

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        aria-label="Open search dialog (⌘K)"
        className={cn("h-9 w-9 rounded-full text-foreground hover:bg-accent", className)}
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label="Open search dialog"
      className={cn(
        "flex items-center gap-3 rounded-full border-border/80 bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:bg-accent/60 transition-colors h-9 font-normal",
        className
      )}
    >
      <Search className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="pr-4 hidden sm:inline">Search kurtis, lehengas, sherwanis...</span>
      <span className="pr-2 sm:hidden">Search...</span>
      <kbd className="pointer-events-none hidden md:inline-flex h-4 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground border border-border/60">
        ⌘K
      </kbd>
    </Button>
  );
}
