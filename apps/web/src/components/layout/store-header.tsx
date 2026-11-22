"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { StoreNav } from "./store-nav";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useCart } from "@/lib/hooks/use-cart";
import { authApi } from "@/lib/api/auth-api";
import { SearchModal } from "@/components/storefront/search-modal";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  Menu,
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { SERVICES } from "@veyora/config";
import { toast } from "sonner";

export function StoreHeader() {
  const { setMobileNavOpen, setCartDrawerOpen } = useUIStore();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { itemCount: wishlistCount } = useWishlist();
  const { totals } = useCart();
  const cartCount = totals.itemCount;
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
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

            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="font-extrabold tracking-tight">{SERVICES.NAME}</span>
            </Link>
          </div>

          <StoreNav />

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Pill Trigger */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center gap-3 rounded-full border-border/80 bg-muted/40 px-3.5 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:bg-accent/60 transition-colors h-8 font-normal"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="pr-4">Search kurtis, lehengas, sarees...</span>
              <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            {/* Mobile / Tablet search icon */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Wishlist Link with Badge */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Wishlist"
              className="relative hidden sm:inline-flex"
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

            {/* Shopping Cart Drawer Trigger */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Shopping Cart Drawer"
              onClick={() => setCartDrawerOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>

            <NotificationBell />

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
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      My Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm" className="hidden sm:inline-flex rounded-full text-xs px-4">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </Container>
      </header>

      {/* Instant Search Overlay */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
