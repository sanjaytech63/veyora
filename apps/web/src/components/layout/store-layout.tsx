import * as React from "react";
import { AnnouncementBar } from "./announcement-bar";
import { StoreHeader } from "./store-header";
import { StoreFooter } from "./store-footer";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar />
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
