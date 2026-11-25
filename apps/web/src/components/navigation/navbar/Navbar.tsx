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
  const searchModalOpen = useUIStore((s) => s.searchModalOpen);
  const setSearchModalOpen = useUIStore((s) => s.setSearchModalOpen);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {showAnnouncement && <AnnouncementBar />}
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md transition-[box-shadow,background-color] duration-200",
          scrolled && "shadow-[0_1px_12px_hsl(var(--foreground)/0.06)]",
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
