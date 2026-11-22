"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Settings, Shield } from "lucide-react";
import { useAdminAuthStore } from "@/stores/admin-auth-store";
import { adminAuthApi } from "@/lib/api/admin-auth-api";
import { toast } from "sonner";

export function UserMenu() {
  const router = useRouter();
  const { admin, clearAdminAuth } = useAdminAuthStore();

  const handleLogout = async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      clearAdminAuth();
      toast.success("Administrator logged out");
      router.push("/login");
    }
  };

  const displayName = admin
    ? `${admin.firstName} ${admin.lastName}`.trim() || admin.email
    : "Admin Operator";
  const displayEmail = admin?.email || "operator@veyora.local";
  const initials = admin?.firstName
    ? `${admin.firstName[0]}${admin.lastName ? admin.lastName[0] : ""}`.toUpperCase()
    : "AD";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full ring-1 ring-border">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {initials}
          </div>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {admin && (
                <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                  {admin.role}
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 cursor-pointer">
          <Link href="/profile">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Shield className="h-4 w-4" />
          <span>Permissions &amp; RBAC</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          <span>System Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
