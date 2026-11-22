"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Category } from "@veyora/types";
import { useProducts, useCategories } from "@/hooks/use-catalog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryClientProps {
  initialCategory: Category;
}

export function CategoryClient({ initialCategory }: CategoryClientProps) {
  const { data: allCategories = [] } = useCategories();
  const [sortBy, setSortBy] = React.useState<"newest" | "price_asc" | "price_desc">("newest");
  const [inStockOnly, setInStockOnly] = React.useState(false);

  const sortParams = React.useMemo(() => {
    if (sortBy === "price_asc") return { sortBy: "price" as const, sortOrder: "asc" as const };
    if (sortBy === "price_desc") return { sortBy: "price" as const, sortOrder: "desc" as const };
    return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
  }, [sortBy]);

  const { data, isLoading } = useProducts({
    categoryId: initialCategory.id,
    limit: 20,
    sortBy: sortParams.sortBy,
    sortOrder: sortParams.sortOrder,
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
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">{initialCategory.name}</span>
        </nav>

        {/* Category Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-muted/60 via-card to-card p-8 sm:p-12 shadow-xs">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Category Collection
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              {initialCategory.name}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {initialCategory.description ||
                "Discover verified models and accessories crafted with precision."}
            </p>
          </div>
        </div>

        {/* Department Quick Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
            <Link href="/shop" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3 w-3" />
              All Categories
            </Link>
          </Button>

          {allCategories.map((c) => (
            <Button
              key={c.id}
              asChild
              variant={c.slug === initialCategory.slug ? "default" : "ghost"}
              size="sm"
              className="rounded-full text-xs font-semibold"
            >
              <Link href={`/category/${c.slug}`}>{c.name}</Link>
            </Button>
          ))}
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
          <span className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{products.length}</strong> items
          </span>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="cat-instock-toggle"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                In Stock Only
              </label>
              <Switch
                id="cat-instock-toggle"
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
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={products}
          categories={allCategories}
          loading={isLoading}
          columns={4}
          emptyTitle={`No products currently found in ${initialCategory.name}`}
          emptyDescription="Check back soon for new hardware releases in this department."
        />
      </Container>
    </div>
  );
}
