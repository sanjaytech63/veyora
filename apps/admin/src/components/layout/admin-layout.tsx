"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { AdminProtectedRoute } from "@/components/common/admin-protected-route";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <main id="admin-main" tabIndex={-1} className="min-h-screen outline-none">
        {children}
      </main>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-background text-foreground">
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-primary focus:rounded-md text-xs font-medium"
        >
          Skip to administrative content
        </a>
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <AdminHeader />
          <main id="admin-main" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
            {children}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
