"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { LoaderCircle } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isAuthenticated, isLoading } = useAdminAuthStore();

  React.useEffect(() => {
    // Skip protection on login page itself
    if (pathname === "/login") return;

    if (!isLoading && (!isAuthenticated || !admin || (admin.role !== "admin" && admin.role !== "superadmin"))) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [admin, isAuthenticated, isLoading, pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying administrator permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated || !admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
    return null;
  }

  return <>{children}</>;
}
