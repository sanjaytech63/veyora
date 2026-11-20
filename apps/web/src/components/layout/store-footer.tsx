import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SERVICES } from "@veyora/config";

export function StoreFooter() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <Container size="xl" className="py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="font-bold text-lg text-primary">{SERVICES.NAME}</span>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Enterprise-grade modern e-commerce storefront foundation built with Next.js 15 &
              Tailwind v4.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Store</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/#catalog" className="hover:text-foreground">
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/#collections" className="hover:text-foreground">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/#featured" className="hover:text-foreground">
                  Featured
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Architecture</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/#design-system" className="hover:text-foreground">
                  Design System
                </Link>
              </li>
              <li>
                <Link href="/#providers" className="hover:text-foreground">
                  Providers
                </Link>
              </li>
              <li>
                <Link href="/#state" className="hover:text-foreground">
                  Client State
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground"
                >
                  Admin Console &rarr;
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:4000/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground"
                >
                  API Health Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>
            &copy; {new Date().getFullYear()} {SERVICES.NAME} Inc. All rights reserved.
          </p>
          <p>Phase B Frontend Infrastructure</p>
        </div>
      </Container>
    </footer>
  );
}
