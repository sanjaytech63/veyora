"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { UserMenu } from "./user-menu";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { useAdminUIStore } from "@/stores/admin-ui-store";
import { Menu, Bell } from "lucide-react";
import { AdminMobileSidebar } from "./admin-mobile-sidebar";

export function AdminHeader() {
  const setMobileSidebarOpen = useAdminUIStore((s) => s.setMobileSidebarOpen);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6 justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <AdminBreadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>

      <AdminMobileSidebar />
    </header>
  );
}
