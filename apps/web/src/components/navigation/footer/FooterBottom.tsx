import * as React from "react";
import { SERVICES } from "@veyora/config";
import { cn } from "@/lib/utils";

interface FooterBottomProps {
  className?: string;
}

export function FooterBottom({ className }: FooterBottomProps) {
  const [currentYear, setCurrentYear] = React.useState<number>(2026);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div
      className={cn(
        "border-t border-border/60 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-muted-foreground gap-4 text-center md:text-left",
        className
      )}
    >
      <p>
        &copy; {currentYear} {SERVICES.NAME} Fashion Atelier. All rights reserved. Contemporary
        Indian Couture &amp; Modern Apparel.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <span className="hover:text-foreground transition-colors cursor-pointer">
          Privacy Policy
        </span>
        <span className="hover:text-foreground transition-colors cursor-pointer">
          Terms of Service
        </span>
        <span className="hover:text-foreground transition-colors cursor-pointer">
          Artisan Ethics Certified
        </span>
      </div>
    </div>
  );
}
