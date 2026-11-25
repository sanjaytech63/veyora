import * as React from "react";
import { Truck, ShieldCheck, PackageSearch, CreditCard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FooterTrustSection({ className }: { className?: string }) {
  const policies = [
    {
      icon: Truck,
      title: "Checkout",
      description: "Shipping methods and delivery estimates are shown before payment.",
      href: "/checkout",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Online card and payment options are provided by Razorpay at checkout.",
      href: "/checkout",
    },
    {
      icon: PackageSearch,
      title: "Order Tracking",
      description: "Check available shipment status using your tracking number.",
      href: "/tracking",
    },
    {
      icon: ShieldCheck,
      title: "Account Support",
      description: "View orders and account details in the secure customer area.",
      href: "/account",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {policies.map((policy) => {
        const Icon = policy.icon;
        return (
          <Link
            key={policy.title}
            href={policy.href}
            className="group flex items-start gap-3.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-card"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-150 group-hover:bg-primary/15">
              <Icon className="h-4 w-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                {policy.title}
              </h2>
              <p className="text-xs leading-5 text-muted-foreground">{policy.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
