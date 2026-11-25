"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavbarLogo } from "./NavbarLogo";
import { useCategories } from "@/hooks/use-catalog";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCart } from "@/lib/hooks/use-cart";
import { authApi } from "@/lib/api/auth-api";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";
import {
  Menu,
  Search,
  ShoppingCart,
  Sparkles,
  ShoppingBag,
  Flame,
  Tag,
  User,
  Package,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarMobileProps {
  onOpenSearch: () => void;
  className?: string;
}

export function NavbarMobile({ onOpenSearch, className }: NavbarMobileProps) {
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { totals } = useCart();
  const cartCount = totals.itemCount;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: categories = [] } = useCategories();
  const activeCategories = React.useMemo(() => {
    return categories.filter((c) => c.status === "active");
  }, [categories]);

  const handleLogout = async () => {
    try {
      const response = await authApi.logout();
      notifyApiSuccess(response);
    } catch (error) {
      notifyApiError(error);
    } finally {
      clearAuth();
      setMobileNavOpen(false);
    }
  };

  const primaryLinks = [
    { label: "Home", href: "/", icon: Sparkles },
    { label: "Shop All Garments", href: "/shop", icon: ShoppingBag },
    { label: "New Arrivals", href: "/new-arrivals", icon: Flame, badge: "New" },
    { label: "Curated Collections", href: "/collections", icon: Sparkles },
  ];

  return (
    <div
      className={cn(
        "md:hidden w-full border-b border-border/60 bg-background/90 backdrop-blur-md",
        className
      )}
    >
      <Container size="xl" className="flex h-14 items-center justify-between gap-2 px-4">
        {/* Hamburger Menu Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open mobile navigation drawer"
          className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full text-foreground hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Center Logo */}
        <NavbarLogo />

        {/* Right Actions: Search + Cart */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenSearch}
            aria-label="Search catalog"
            className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full text-foreground hover:bg-accent"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCartDrawerOpen(true)}
            aria-label={`Shopping Cart (${mounted ? cartCount : 0} items)`}
            className="relative h-10 w-10 min-h-[44px] min-w-[44px] rounded-full text-foreground hover:bg-accent"
          >
            <ShoppingCart className="h-5 w-5" />
            {mounted && cartCount > 0 && (
              <span className="absolute 1 top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Button>
        </div>
      </Container>

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="p-0 w-[300px] sm:w-[350px] flex flex-col justify-between"
        >
          <SheetHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between text-left">
            <SheetTitle asChild>
              <div>
                <NavbarLogo onClick={() => setMobileNavOpen(false)} />
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable Navigation Body */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {/* Mobile Search Quick Trigger */}
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onOpenSearch();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground hover:bg-accent hover:border-primary/40 transition-colors min-h-[44px]"
            >
              <span className="flex items-center gap-2.5">
                <Search className="h-4 w-4" />
                <span>Search couture garments...</span>
              </span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono border border-border/60">
                ⌘K
              </kbd>
            </button>

            {/* Primary Store Links */}
            <nav aria-label="Mobile Navigation" className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3">
                Menu
              </span>
              <div className="space-y-0.5 pt-1">
                {primaryLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileNavOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors min-h-[44px]"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{link.label}</span>
                      </span>
                      {link.badge && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Dynamic Categories */}
            {activeCategories.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3">
                  Departments
                </span>
                <div className="space-y-0.5 pt-1">
                  {activeCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      onClick={() => setMobileNavOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors min-h-[44px]"
                    >
                      <span className="flex items-center gap-3">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{cat.name}</span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer / Account & Auth */}
          <div className="border-t border-border/60 p-4 bg-muted/20">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2">
                  <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-9">
                    <Link href="/profile" onClick={() => setMobileNavOpen(false)}>
                      <User className="h-3.5 w-3.5 mr-1" />
                      Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-9">
                    <Link href="/orders" onClick={() => setMobileNavOpen(false)}>
                      <Package className="h-3.5 w-3.5 mr-1" />
                      Orders
                    </Link>
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 h-9 rounded-xl mt-1"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Sign in to access saved items, orders, and express atelier checkout.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="rounded-xl text-xs font-semibold h-10"
                  >
                    <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-semibold h-10"
                  >
                    <Link href="/register" onClick={() => setMobileNavOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
