import * as React from "react";
import { Truck, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function FooterTrustSection({ className }: { className?: string }) {
  const policies = [
    {
      icon: Truck,
      title: "Worldwide Express Dispatch",
      description: "Insured door-to-door delivery on all domestic & international orders.",
    },
    {
      icon: Sparkles,
      title: "Artisanal Provenance",
      description: "Authentic handwoven Chanderi, Banarasi brocades & pure mulmul cotton.",
    },
    {
      icon: ShieldCheck,
      title: "Encrypted Transactions",
      description: "Idempotent payment processing with 256-bit cryptographic validation.",
    },
    {
      icon: Clock,
      title: "Atelier Concierge",
      description: "Expert assistance with bespoke sizing, custom drapes & bridal styling.",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-10 border-b border-border/60",
        className
      )}
    >
      {policies.map((policy) => {
        const Icon = policy.icon;
        return (
          <div key={policy.title} className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {policy.title}
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {policy.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
