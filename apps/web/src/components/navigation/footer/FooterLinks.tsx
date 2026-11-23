"use client";

import * as React from "react";
import Link from "next/link";
import { useCategories } from "@/hooks/use-catalog";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterLinksProps {
  className?: string;
}

export function FooterLinks({ className }: FooterLinksProps) {
  const { data: categories = [] } = useCategories();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    categories: false,
    concierge: false,
    operations: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeCategories = React.useMemo(() => {
    return categories.filter((c) => c.status === "active").slice(0, 6);
  }, [categories]);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-8", className)}>
      {/* Column 1: Dynamic Fashion Departments */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection("categories")}
          className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-foreground md:cursor-default"
          aria-expanded={openSections.categories}
        >
          <span>Fashion Categories</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform md:hidden text-muted-foreground",
              openSections.categories && "rotate-180"
            )}
          />
        </button>

        <ul
          className={cn(
            "space-y-2.5 text-xs text-muted-foreground",
            !openSections.categories && "hidden md:block"
          )}
        >
          <li>
            <Link href="/shop" className="hover:text-foreground transition-colors">
              Shop All Garments
            </Link>
          </li>
          {activeCategories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/category/${cat.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {cat.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/collections" className="hover:text-foreground transition-colors">
              Curated Collections
            </Link>
          </li>
        </ul>
      </div>

      {/* Column 2: Client Concierge */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection("concierge")}
          className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-foreground md:cursor-default"
          aria-expanded={openSections.concierge}
        >
          <span>Client Concierge</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform md:hidden text-muted-foreground",
              openSections.concierge && "rotate-180"
            )}
          />
        </button>

        <ul
          className={cn(
            "space-y-2.5 text-xs text-muted-foreground",
            !openSections.concierge && "hidden md:block"
          )}
        >
          <li>
            <Link href="/wishlist" className="hover:text-foreground transition-colors">
              Saved Wishlist
            </Link>
          </li>
          <li>
            <Link href="/cart" className="hover:text-foreground transition-colors">
              Shopping Bag
            </Link>
          </li>
          <li>
            <Link href="/checkout" className="hover:text-foreground transition-colors">
              Express Checkout
            </Link>
          </li>
          <li>
            <Link href="/new-arrivals" className="hover:text-foreground transition-colors">
              New Arrivals Drop
            </Link>
          </li>
          <li>
            <Link href="/profile" className="hover:text-foreground transition-colors">
              My Orders &amp; Profile
            </Link>
          </li>
        </ul>
      </div>

      {/* Column 3: Brand Operations */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection("operations")}
          className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-foreground md:cursor-default"
          aria-expanded={openSections.operations}
        >
          <span>Brand Operations</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform md:hidden text-muted-foreground",
              openSections.operations && "rotate-180"
            )}
          />
        </button>

        <ul
          className={cn(
            "space-y-2.5 text-xs text-muted-foreground",
            !openSections.operations && "hidden md:block"
          )}
        >
          <li>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <span>Atelier Merchant Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>
            <a
              href="http://localhost:4000/health"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <span>Telemetry &amp; Service Status</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li className="pt-2 text-[11px] text-muted-foreground/80 leading-relaxed">
            Registered atelier crafting fine silks and hand-embroidered wedding couture.
          </li>
        </ul>
      </div>
    </div>
  );
}
