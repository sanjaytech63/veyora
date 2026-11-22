"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Boxes,
  FolderTree,
  Tags,
  Sparkles,
  ShoppingBag,
  Truck,
  Users,
  TicketPercent,
  Star,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Products & Apparel", href: "/products", icon: Package },
  { title: "Fashion Categories", href: "/categories", icon: FolderTree },
  { title: "Curated Collections", href: "/collections", icon: Sparkles },
  { title: "Inventory & Stock", href: "/inventory", icon: Boxes },
  { title: "Orders", href: "/orders", icon: ShoppingBag },
  { title: "Shipments & Fulfillment", href: "/shipments", icon: Truck },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Coupons & Discounts", href: "/coupons", icon: TicketPercent },
  { title: "Customer Reviews", href: "/reviews", icon: Star },
  { title: "Fashion Ateliers", href: "/brands", icon: Tags },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-1 px-2 text-sm font-medium">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:text-foreground hover:bg-accent/60",
              isActive && "bg-primary text-primary-foreground font-semibold hover:bg-primary hover:text-primary-foreground",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? item.title : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-xs">{item.title}</span>}
            {!collapsed && item.badge && (
              <span className="ml-auto flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-[10px] font-medium text-primary">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
