"use client";

import * as React from "react";
import { ProductVariant } from "@veyora/types";
import { cn } from "@/lib/utils";
import { Check, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [sizeGuideOpen, setSizeGuideOpen] = React.useState(false);

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

  // Extract distinct sizes
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
    const currentSize = selectedVariant?.size;
    const match =
      variants.find((v) => v.color === color && (!currentSize || v.size === currentSize)) ||
      variants.find((v) => v.color === color);
    if (match) onSelectVariant(match);
  };

  const handleSizeChange = (size: string) => {
    const currentColor = selectedVariant?.color;
    const match =
      variants.find((v) => v.size === size && (!currentColor || v.color === currentColor)) ||
      variants.find((v) => v.size === size);
    if (match) onSelectVariant(match);
  };

  const getColorClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("red") || n.includes("crimson") || n.includes("ruby") || n.includes("maroon") || n.includes("vermilion"))
      return "bg-red-700";
    if (n.includes("green") || n.includes("emerald") || n.includes("sage") || n.includes("olive"))
      return "bg-emerald-800";
    if (n.includes("gold") || n.includes("mustard") || n.includes("amber") || n.includes("yellow") || n.includes("turmeric"))
      return "bg-amber-500";
    if (n.includes("blue") || n.includes("indigo") || n.includes("royal") || n.includes("navy"))
      return "bg-indigo-900";
    if (n.includes("pink") || n.includes("rose") || n.includes("blush") || n.includes("magenta"))
      return "bg-pink-600";
    if (n.includes("ivory") || n.includes("pearl") || n.includes("champagne") || n.includes("cream") || n.includes("ecru"))
      return "bg-amber-100 border border-border";
    if (n.includes("rust") || n.includes("terracotta") || n.includes("copper") || n.includes("orange"))
      return "bg-orange-700";
    if (n.includes("black") || n.includes("midnight") || n.includes("noir"))
      return "bg-zinc-950";
    if (n.includes("beige") || n.includes("sand") || n.includes("oatmeal"))
      return "bg-amber-200/80 border border-border";
    return "bg-primary";
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Color Selection */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Color / Palette</span>
            <span className="text-muted-foreground text-xs font-medium">
              {selectedVariant?.color || "Select Color"}
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
                        color.toLowerCase().includes("white") ||
                          color.toLowerCase().includes("ivory") ||
                          color.toLowerCase().includes("cream")
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

      {/* Size Selection with Fashion Size Guide */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Garment Size</span>

            {/* Size Guide Modal Dialog */}
            <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <Ruler className="h-3 w-3" />
                  <span>Size &amp; Fit Guide</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Apparel Size Chart</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Standard garment body measurements in inches for Kurtis, Dresses, and Ensembles.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead className="font-bold">Size</TableHead>
                        <TableHead>Bust (in)</TableHead>
                        <TableHead>Waist (in)</TableHead>
                        <TableHead>Hip (in)</TableHead>
                        <TableHead>Length (in)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      <TableRow>
                        <TableCell className="font-bold">XS</TableCell>
                        <TableCell>32 - 33</TableCell>
                        <TableCell>26 - 27</TableCell>
                        <TableCell>36 - 37</TableCell>
                        <TableCell>44</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold">S</TableCell>
                        <TableCell>34 - 35</TableCell>
                        <TableCell>28 - 29</TableCell>
                        <TableCell>38 - 39</TableCell>
                        <TableCell>45</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold">M</TableCell>
                        <TableCell>36 - 37</TableCell>
                        <TableCell>30 - 31</TableCell>
                        <TableCell>40 - 41</TableCell>
                        <TableCell>45</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold">L</TableCell>
                        <TableCell>38 - 40</TableCell>
                        <TableCell>32 - 34</TableCell>
                        <TableCell>42 - 44</TableCell>
                        <TableCell>46</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold">XL</TableCell>
                        <TableCell>41 - 43</TableCell>
                        <TableCell>35 - 37</TableCell>
                        <TableCell>45 - 47</TableCell>
                        <TableCell>46</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold">XXL</TableCell>
                        <TableCell>44 - 46</TableCell>
                        <TableCell>38 - 40</TableCell>
                        <TableCell>48 - 50</TableCell>
                        <TableCell>47</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Fit Advice:</strong> If you are between sizes, we recommend ordering one size up for traditional straight and A-line kurtis.
                </div>
              </DialogContent>
            </Dialog>
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
