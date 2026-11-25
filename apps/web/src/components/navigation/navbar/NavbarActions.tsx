"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchTrigger } from "../search/SearchTrigger";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, Heart, User as UserIcon, Package, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useCart } from "@/lib/hooks/use-cart";
import { useUIStore } from "@/stores/ui-store";
import { authApi } from "@/lib/api/auth-api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavbarActionsProps {
  onOpenSearch: () => void;
  className?: string;
}

export function NavbarActions({ onOpenSearch, className }: NavbarActionsProps) {
  const { setCartDrawerOpen } = useUIStore();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { itemCount: wishlistCount } = useWishlist();
  const { totals } = useCart();
  const cartCount = totals.itemCount;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue cleanup even if network fails
    } finally {
      clearAuth();
      toast.success("Signed out successfully");
    }
  };

  return (
    <div className={cn("flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0", className)}>
      {/* Search Trigger — compact icon on laptops/medium screens, expanded pill on large desktops */}
      <SearchTrigger onClick={onOpenSearch} variant="pill" className="hidden xl:flex" />
      <SearchTrigger onClick={onOpenSearch} variant="icon" className="xl:hidden" />

      {/* Wishlist Action */}
      <Button
        asChild
        variant="ghost"
        size="icon"
        aria-label={`Wishlist (${mounted ? wishlistCount : 0} items)`}
        className="relative hidden sm:inline-flex h-9 w-9 rounded-full text-foreground hover:bg-accent"
      >
        <Link href="/wishlist">
          <Heart className="h-4 w-4" />
          {mounted && wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </Link>
      </Button>

      {/* Shopping Bag Action */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Shopping Bag (${mounted ? cartCount : 0} items)`}
        onClick={() => setCartDrawerOpen(true)}
        className="relative h-9 w-9 rounded-full text-foreground hover:bg-accent"
      >
        <ShoppingCart className="h-4 w-4" />
        {mounted && cartCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Button>

      {/* Notification Bell */}
      <NotificationBell />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Account Navigation */}
      {isAuthenticated && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full ring-1 ring-border ml-1 h-8 w-8 p-0"
              aria-label="User account menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl p-2 shadow-xl border-border/80"
          >
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="cursor-pointer text-xs font-medium py-2 rounded-xl flex items-center"
              >
                <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Account Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/orders"
                className="cursor-pointer text-xs font-medium py-2 rounded-xl flex items-center"
              >
                <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>My Orders</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/wishlist"
                className="cursor-pointer text-xs font-medium py-2 rounded-xl flex items-center"
              >
                <Heart className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Saved Wishlist</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-xs font-medium py-2 rounded-xl text-destructive focus:text-destructive flex items-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          asChild
          variant="default"
          size="sm"
          className="inline-flex rounded-full text-xs px-3 sm:px-4 h-8 font-semibold shadow-xs shrink-0"
        >
          <Link href="/login">Sign In</Link>
        </Button>
      )}
    </div>
  );
}
