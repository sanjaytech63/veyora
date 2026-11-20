"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { StoreNav } from "./store-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingBag, Menu, Search, ShoppingCart, User as UserIcon, LogOut } from "lucide-react";
import { SERVICES } from "@veyora/config";
import { toast } from "sonner";

export function StoreHeader() {
  const { setMobileNavOpen, setCartDrawerOpen } = useUIStore();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      clearAuth();
      toast.success("Signed out successfully");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <Container size="xl" className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span>{SERVICES.NAME}</span>
          </Link>
        </div>

        <StoreNav />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => {}}>
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Shopping Cart Drawer"
            onClick={() => setCartDrawerOpen(true)}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              0
            </span>
          </Button>

          <ThemeToggle />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ring-1 ring-border ml-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href="/account">
                    <UserIcon className="h-4 w-4" />
                    <span>My Account</span>
                  </Link>
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
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </Container>
      <MobileNav />
    </header>
  );
}
