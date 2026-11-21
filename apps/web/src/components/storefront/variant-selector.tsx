"use client";

import * as React from "react";
import { ProductVariant } from "@veyora/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
  className?: string;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelectVariant,
  className,
}: VariantSelectorProps) {
  // Extract distinct colors
  const colors = React.useMemo(() => {
    const list: string[] = [];
    variants.forEach((v) => {
      if (v.color && !list.includes(v.color)) {
        list.push(v.color);
      }
    });
    return list;
  }, [variants]);

  // Extract distinct sizes / configurations
  const sizes = React.useMemo(() => {
    const list: string[] = [];
    variants.forEach((v) => {
      if (v.size && !list.includes(v.size)) {
        list.push(v.size);
      }
    });
    return list;
  }, [variants]);

  if (variants.length === 0) return null;

  const handleColorChange = (color: string) => {
    // Find matching variant with current size or fallback to first with this color
    const currentSize = selectedVariant?.size;
    const match =
      variants.find((v) => v.color === color && (!currentSize || v.size === currentSize)) ||
      variants.find((v) => v.color === color);
    if (match) onSelectVariant(match);
  };

  const handleSizeChange = (size: string) => {
    // Find matching variant with current color or fallback to first with this size
    const currentColor = selectedVariant?.color;
    const match =
      variants.find((v) => v.size === size && (!currentColor || v.color === currentColor)) ||
      variants.find((v) => v.size === size);
    if (match) onSelectVariant(match);
  };

  const getColorClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("black") || n.includes("obsidian")) return "bg-zinc-950";
    if (n.includes("silver") || n.includes("frost")) return "bg-zinc-200 dark:bg-zinc-400";
    if (n.includes("sand") || n.includes("cognac")) return "bg-amber-700";
    if (n.includes("white") || n.includes("chalk")) return "bg-zinc-100 border border-border";
    if (n.includes("slate") || n.includes("gray") || n.includes("grey")) return "bg-slate-600";
    if (n.includes("blue") || n.includes("navy")) return "bg-blue-900";
    if (n.includes("green") || n.includes("sage")) return "bg-emerald-800";
    return "bg-primary";
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Color Selection */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Color / Finish</span>
            <span className="text-muted-foreground text-xs font-medium">
              {selectedVariant?.color || "Select Finish"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {colors.map((color) => {
              const isSelected = selectedVariant?.color === color;
              const matchingVar = variants.find((v) => v.color === color);
              const isOutOfStock = matchingVar ? matchingVar.stock <= 0 : false;

              return (
                <Button
                  key={color}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleColorChange(color)}
                  aria-label={`Select ${color}`}
                  title={`${color}${isOutOfStock ? " (Out of Stock)" : ""}`}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full transition-all ring-offset-background p-0",
                    getColorClass(color),
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-sm hover:opacity-100"
                      : "hover:scale-105 opacity-85 hover:opacity-100",
                    isOutOfStock && "opacity-40"
                  )}
                >
                  {isSelected && (
                    <Check
                      className={cn(
                        "h-4 w-4 drop-shadow-sm",
                        color.toLowerCase().includes("white") || color.toLowerCase().includes("silver")
                          ? "text-zinc-900"
                          : "text-white"
                      )}
                    />
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-0.5 w-full bg-destructive rotate-45" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size / Configuration Selection */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Configuration / Size</span>
            <span className="text-muted-foreground text-xs font-medium">
              {selectedVariant?.size || "Select Specification"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size) => {
              const isSelected = selectedVariant?.size === size;
              const matchingVar = variants.find(
                (v) => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color)
              );
              const isOutOfStock = matchingVar ? matchingVar.stock <= 0 : false;

              return (
                <Button
                  key={size}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSizeChange(size)}
                  disabled={isOutOfStock}
                  className={cn(
                    "rounded-xl px-4 py-2 text-xs font-semibold tracking-tight transition-all",
                    isSelected
                      ? "shadow-xs"
                      : "hover:border-foreground/40 hover:bg-accent/40",
                    isOutOfStock &&
                      "cursor-not-allowed border-dashed bg-muted/20 text-muted-foreground line-through opacity-50"
                  )}
                >
                  {size}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
