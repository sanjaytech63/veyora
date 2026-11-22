"use client";

import * as React from "react";
import { ProductAttribute } from "@veyora/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ShieldCheck, Truck, Sparkles } from "lucide-react";
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

export function ProductAccordion({ attributes = [], sku, className }: ProductAccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(["specs"]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const items: AccordionItem[] = [
    {
      id: "specs",
      title: "Garment Specifications & Fabric Details",
      icon: Sparkles,
      content: (
        <div className="space-y-3 pt-2 text-xs sm:text-sm">
          <div className="flex justify-between py-1.5 border-b border-border/40 text-muted-foreground">
            <span>Garment SKU</span>
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
            <span>Quality Certification</span>
            <span className="text-foreground font-medium">
              100% Handloom &amp; Certified Pure Silks
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "shipping",
      title: "Express Delivery & Complimentary Size Exchanges",
      icon: Truck,
      content: (
        <div className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>• Orders placed before 3:00 PM ship same-day in protective garment covers.</p>
          <p>• Worldwide express delivery via tracked, insured courier partners.</p>
          <p>• Complimentary doorstep size exchange within 15 days of receiving your order.</p>
          <p>• Real-time SMS and email tracking milestone updates provided upon dispatch.</p>
        </div>
      ),
    },
    {
      id: "care",
      title: "Artisan Heritage & Care Instructions",
      icon: ShieldCheck,
      content: (
        <div className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>
            • Handcrafted by regional master artisans using heritage Indian hand-block printing,
            Bandhani tie-dye, and traditional zari brocade techniques.
          </p>
          <p>
            • For pure silks, Chanderi, and embroidered garments: professional dry clean only to
            maintain fabric lustre.
          </p>
          <p>
            • For pure organic mulmul cotton: gentle cold hand wash separately with mild detergent;
            dry in shade.
          </p>
          <p>• Iron on low heat or use a vertical garment steamer.</p>
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
            {isOpen && (
              <div className="mt-3 pr-2 animate-in fade-in-50 duration-200">{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
