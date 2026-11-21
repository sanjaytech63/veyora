"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useCart } from "@/lib/hooks/use-cart";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Home, Compass, Heart, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { setCartDrawerOpen } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { itemCount: wishlistCount } = useWishlist();
  const { totals } = useCart();
  const cartCount = totals.itemCount;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const items = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Shop",
      href: "/shop",
      icon: Compass,
      isActive: pathname === "/shop" || pathname.startsWith("/category") || pathname.startsWith("/products"),
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      icon: Heart,
      isActive: pathname === "/wishlist",
      badge: mounted && wishlistCount > 0 ? wishlistCount : null,
    },
    {
      label: "Bag",
      onClick: () => setCartDrawerOpen(true),
      icon: ShoppingBag,
      isActive: pathname === "/cart",
      badge: mounted && cartCount > 0 ? cartCount : null,
    },
    {
      label: "Account",
      href: isAuthenticated ? "/profile" : "/login",
      icon: User,
      isActive: pathname === "/profile" || pathname === "/login" || pathname === "/register",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/90 backdrop-blur-xl shadow-lg pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-center justify-around px-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;

          if (item.onClick) {
            return (
              <Button
                key={item.label}
                type="button"
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 h-auto py-1 px-0 hover:bg-transparent focus:outline-none",
                  item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={`Open shopping bag, ${cartCount} items`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {typeof item.badge === "number" && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </Button>
            );
          }

          return (
            <Button
              key={item.label}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 h-auto py-1 px-0 hover:bg-transparent focus:outline-none",
                item.isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={item.href!}>
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      item.isActive && "scale-105"
                    )}
                  />
                  {typeof item.badge === "number" && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
