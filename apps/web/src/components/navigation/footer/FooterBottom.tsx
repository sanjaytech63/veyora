"use client";

import * as React from "react";
import { SERVICES } from "@veyora/config";
import { cn } from "@/lib/utils";

interface FooterBottomProps {
  className?: string;
}

export function FooterBottom({ className }: FooterBottomProps) {
  const [currentYear, setCurrentYear] = React.useState(2026);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div
      className={cn(
        "mt-10 border-t border-border/70 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center md:text-left",
        className
      )}
    >
      <p suppressHydrationWarning>
        &copy; {currentYear} {SERVICES.NAME}. All rights reserved.
      </p>
    </div>
  );
}
