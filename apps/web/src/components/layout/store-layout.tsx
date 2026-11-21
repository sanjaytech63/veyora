import * as React from "react";
import { AnnouncementBar } from "./announcement-bar";
import { StoreHeader } from "./store-header";
import { StoreFooter } from "./store-footer";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { CartDrawer } from "@/components/storefront/cart-drawer";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <StoreFooter />
      <MobileBottomNav />
      <CartDrawer />
    </div>
  );
}
