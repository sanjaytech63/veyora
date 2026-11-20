"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  Layers,
  Settings,
  Shield,
  Activity,
  Database,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const adminNavItems: NavItem[] = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Products", href: "/products", icon: Package, badge: "Phase E" },
  { title: "Categories", href: "/categories", icon: FolderTree },
  { title: "Brands", href: "/brands", icon: Tags },
  { title: "UI Components", href: "/#components", icon: Layers, badge: "Phase B" },
  { title: "Data Table", href: "/#data-table", icon: Database },
  { title: "Observability", href: "/#system", icon: Activity },
  { title: "Analytics Skeleton", href: "/#analytics", icon: BarChart3 },
  { title: "Security & Roles", href: "/#security", icon: Shield },
  { title: "Configuration", href: "/#settings", icon: Settings },
];

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-1 px-2 text-sm font-medium">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent",
              isActive && "bg-accent text-accent-foreground font-semibold",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? item.title : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
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
