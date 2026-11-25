"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useProducts } from "@/hooks/use-catalog";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewArrivalsPage() {
  const { data: categories = [] } = useCategories();
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"newest" | "price_asc" | "price_desc">("newest");

  const sortParams = React.useMemo(() => {
    if (sortBy === "price_asc") return { sortBy: "price" as const, sortOrder: "asc" as const };
    if (sortBy === "price_desc") return { sortBy: "price" as const, sortOrder: "desc" as const };
    return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
  }, [sortBy]);

  const { data, isLoading } = useProducts({
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    sortBy: sortParams.sortBy,
    sortOrder: sortParams.sortOrder,
    limit: 20,
  });

  const products = React.useMemo(() => {
    const list = data?.items || [];
    if (!inStockOnly) return list;
    return list.filter((p) => p.stock > 0);
  }, [data?.items, inStockOnly]);

  return (
    <div className="py-8 md:py-12 space-y-10">
      <Container size="xl" className="space-y-8">
        {/* Breadcrumb Trail */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">New Arrivals</span>
        </nav>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-muted/50 via-card to-card p-8 sm:p-12 shadow-xs">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>Season 2026 Ready-to-Wear</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              New Arrivals
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore freshly tailored Indian couture, handwoven Chanderi sets, pure mulmul daily
              kurtis, and contemporary festive silhouettes.
            </p>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Button
            type="button"
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="rounded-full text-xs font-semibold"
          >
            All New Garments
          </Button>

          {categories.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant={selectedCategory === c.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(c.id)}
              className={cn(
                "rounded-full text-xs font-semibold",
                selectedCategory !== c.id && "border border-border/60"
              )}
            >
              {c.name}
            </Button>
          ))}
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
          <span className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{products.length}</strong> new releases
          </span>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="new-instock-toggle"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                In Stock Only
              </label>
              <Switch
                id="new-instock-toggle"
                checked={inStockOnly}
                onCheckedChange={setInStockOnly}
              />
            </div>

            <Select
              value={sortBy}
              onValueChange={(val: "newest" | "price_asc" | "price_desc") => setSortBy(val)}
            >
              <SelectTrigger className="w-[170px] rounded-xl text-xs font-medium border-border/60">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="newest">Recently Published</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={products}
          categories={categories}
          loading={isLoading}
          columns={4}
          emptyTitle="No new arrivals found"
          emptyDescription="Check back soon for upcoming capsule releases and seasonal drops."
          onResetFilters={() => {
            setSelectedCategory("all");
            setInStockOnly(false);
          }}
        />
      </Container>
    </div>
  );
}
