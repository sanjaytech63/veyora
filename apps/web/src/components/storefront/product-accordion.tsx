"use client";

import * as React from "react";
import { ProductAttribute } from "@veyora/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ShieldCheck, Truck, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductAccordionProps {
  attributes?: ProductAttribute[];
  sku: string;
  className?: string;
}

interface AccordionItem {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export function ProductAccordion({
  attributes = [],
  sku,
  className,
}: ProductAccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(["specs"]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const items: AccordionItem[] = [
    {
      id: "specs",
      title: "Technical Specifications & Hardware Details",
      icon: Layers,
      content: (
        <div className="space-y-3 pt-2 text-xs sm:text-sm">
          <div className="flex justify-between py-1.5 border-b border-border/40 text-muted-foreground">
            <span>Model SKU</span>
            <span className="font-mono text-foreground font-medium">{sku}</span>
          </div>
          {attributes.map((attr, idx) => (
            <div
              key={idx}
              className="flex justify-between py-1.5 border-b border-border/40 text-muted-foreground"
            >
              <span>{attr.name}</span>
              <span className="text-foreground font-medium text-right max-w-[60%]">
                {attr.value}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-1.5 text-muted-foreground">
            <span>Certification</span>
            <span className="text-foreground font-medium">CE, FCC, RoHS, Qi2 Standard</span>
          </div>
        </div>
      ),
    },
    {
      id: "shipping",
      title: "Express Dispatch & Carbon-Neutral Transport",
      icon: Truck,
      content: (
        <div className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>
            • Orders placed before 3:00 PM EST ship same-day from our climate-controlled fulfillment hub.
          </p>
          <p>
            • 100% Carbon-Neutral delivery via verified sustainable transport partners.
          </p>
          <p>
            • Tracking link with real-time GPS courier milestone updates provided upon dispatch.
          </p>
          <p>
            • Hassle-free 30-day trial period with complimentary pre-paid return shipping.
          </p>
        </div>
      ),
    },
    {
      id: "warranty",
      title: "Materials, Provenance & Lifetime Craftsmanship",
      icon: ShieldCheck,
      content: (
        <div className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>
            • Precision-machined from recyclable aircraft-grade aluminum alloys and certified vegetable-tanned full-grain leathers.
          </p>
          <p>
            • Designed for repairability: modular construction allows individual component replacement.
          </p>
          <p>
            • Includes Veyora Atelier 2-Year Comprehensive Limited Hardware Warranty against manufacturing imperfections.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className={cn("divide-y divide-border/60 border-y border-border/60", className)}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);
        const Icon = item.icon;

        return (
          <div key={item.id} className="py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-foreground transition-colors hover:text-primary hover:bg-transparent p-0 h-auto"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.title}</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180 text-foreground"
                )}
              />
            </Button>
            {isOpen && <div className="mt-3 pr-2 animate-in fade-in-50 duration-200">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
