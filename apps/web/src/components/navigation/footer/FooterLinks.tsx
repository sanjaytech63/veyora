"use client";

import * as React from "react";
import Link from "next/link";
import { useCategories } from "@/hooks/use-catalog";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { footerLinkColumns } from "./footer.config";

interface FooterLinksProps {
  className?: string;
}

export function FooterLinks({ className }: FooterLinksProps) {
  const { data: categories = [] } = useCategories();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeCategories = React.useMemo(() => {
    return categories.filter((c) => c.status === "active").slice(0, 6);
  }, [categories]);

  return (
    <nav
      aria-label="Footer navigation"
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {footerLinkColumns.map((column) => (
        <FooterColumn
          key={column.id}
          id={column.id}
          title={column.title}
          links={column.links}
          open={Boolean(openSections[column.id])}
          onToggle={() => toggleSection(column.id)}
        />
      ))}

      <FooterColumn
        id="categories"
        title="Categories"
        open={Boolean(openSections.categories)}
        onToggle={() => toggleSection("categories")}
        links={activeCategories.map((category) => ({
          label: category.name,
          href: `/category/${category.slug}`,
        }))}
      />
    </nav>
  );
}

interface FooterColumnProps {
  id: string;
  title: string;
  links: { label: string; href: string }[];
  open: boolean;
  onToggle: () => void;
}

function FooterColumn({ id, title, links, open, onToggle }: FooterColumnProps) {
  return (
    <div className="border-b border-border/60 pb-3 md:border-0 md:pb-0">
      <button
        type="button"
        id={`${id}-footer-heading`}
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-foreground md:pointer-events-none"
        aria-expanded={open}
        aria-controls={`${id}-footer-links`}
      >
        <span>{title}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 md:hidden",
            open && "rotate-180"
          )}
        />
      </button>

      <ul
        id={`${id}-footer-links`}
        aria-labelledby={`${id}-footer-heading`}
        className={cn(
          "space-y-2.5 pt-1 text-sm text-muted-foreground md:block",
          open ? "block" : "hidden"
        )}
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="relative inline-block py-0.5 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
