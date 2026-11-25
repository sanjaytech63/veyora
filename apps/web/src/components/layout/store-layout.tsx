import * as React from "react";
import { AnnouncementBar } from "./announcement-bar";
import { StoreHeader } from "./store-header";
import { StoreFooter } from "./store-footer";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { CartDrawer } from "@/components/storefront/cart-drawer";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-primary focus:rounded-md text-xs font-medium"
      >
        Skip to main content
      </a>
      <AnnouncementBar />
      <React.Suspense fallback={<div className="h-16 w-full bg-background" />}>
        <StoreHeader />
      </React.Suspense>
      <main id="main-content" tabIndex={-1} className="flex-1 pb-16 md:pb-0 outline-none">
        {children}
      </main>
      <StoreFooter />
      <React.Suspense fallback={null}>
        <MobileBottomNav />
      </React.Suspense>
      <CartDrawer />
    </div>
  );
}
