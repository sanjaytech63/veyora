"use client";

import * as React from "react";
import Link from "next/link";
import { useAdminUIStore } from "@/stores/admin-ui-store";
import { AdminNav } from "./admin-nav";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@veyora/config";
import { ShieldCheck, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const sidebarCollapsed = useAdminUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAdminUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 h-screen sticky top-0 z-30",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center border-b border-border px-4 justify-between">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-bold tracking-tight",
            sidebarCollapsed && "justify-center w-full"
          )}
        >
          <Layers className="h-5 w-5 text-primary shrink-0" />
          {!sidebarCollapsed && (
            <span className="text-base text-foreground">
              {SERVICES.NAME} <span className="text-primary font-normal">Admin</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <AdminNav collapsed={sidebarCollapsed} />
      </div>

      {/* Bottom Footer / Collapse Toggle */}
      <div className="border-t border-border p-3 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>v{SERVICES.VERSION} Foundation</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("h-8 w-8 ml-auto", sidebarCollapsed && "mx-auto")}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
