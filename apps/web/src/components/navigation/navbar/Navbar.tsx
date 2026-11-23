"use client";

import * as React from "react";
import { AnnouncementBar } from "./AnnouncementBar";
import { NavbarDesktop } from "./NavbarDesktop";
import { NavbarMobile } from "./NavbarMobile";
import { SearchDialog } from "../search/SearchDialog";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
  showAnnouncement?: boolean;
}

export function Navbar({ className, showAnnouncement = true }: NavbarProps) {
  const { searchModalOpen, setSearchModalOpen } = useUIStore();

  return (
    <>
      {showAnnouncement && <AnnouncementBar />}
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-shadow",
          className
        )}
      >
        <NavbarDesktop onOpenSearch={() => setSearchModalOpen(true)} />
        <NavbarMobile onOpenSearch={() => setSearchModalOpen(true)} />
      </header>

      {/* Global Instant Search Dialog */}
      <SearchDialog open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
}
