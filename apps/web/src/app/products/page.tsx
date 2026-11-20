"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogApi } from "@/lib/api/catalog-api";
import { Product, Category } from "@veyora/types";
import { Search, Package, X } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"newest" | "price_asc" | "price_desc">("newest");
  const [inStockOnly, setInStockOnly] = React.useState(false);

  React.useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          catalogApi.getProducts({ limit: 40 }),
          catalogApi.getCategories(),
        ]);

        if (prodRes.status === "fulfilled") {
          setProducts(prodRes.value);
        }
        if (catRes.status === "fulfilled") {
          setCategories(catRes.value);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  const filteredAndSortedProducts = React.useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          search === "" ||
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()) ||
          p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory =
          selectedCategory === "all" || p.categoryId === selectedCategory;

        const matchesStock = !inStockOnly || p.stock > 0;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, search, selectedCategory, sortBy, inStockOnly]);

  return (
    <div className="py-8 md:py-12">
      <Container size="xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Explore All Products
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Browse our curated catalog of modern products with verified inventory and clear variant options.
          </p>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="mb-8 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by title or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="category-select" className="text-xs font-medium text-muted-foreground">Category:</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs font-medium text-muted-foreground">Sort:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "price_asc" | "price_desc")}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-input"
              />
              In Stock Only
            </label>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="rounded-full shrink-0"
          >
            All Products
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="rounded-full shrink-0"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
                <div className="aspect-square w-full rounded-lg bg-muted" />
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-5 w-1/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No products found</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              We couldn't find any products matching your current filters. Try selecting a different category or clearing search terms.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setInStockOnly(false);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredAndSortedProducts.map((product) => {
              const primaryImage =
                product.images?.find((img) => img.isPrimary)?.url ||
                product.images?.[0]?.url;

              const hasVariants = product.variants && product.variants.length > 0;
              const isDiscounted =
                product.compareAtPrice && product.compareAtPrice > product.price;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/40"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-muted">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.title}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/40">
                        <Package className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Badges Overlay */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      {isDiscounted && (
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">
                          Sale
                        </Badge>
                      )}
                      {hasVariants && (
                        <Badge variant="secondary" className="text-[10px]">
                          {product.variants.length} Variants
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="flex flex-1 flex-col p-4">
                    {product.category && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {product.category.name}
                      </span>
                    )}

                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {product.title}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 flex-1">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-foreground">
                          ${product.price.toFixed(2)}
                        </span>
                        {isDiscounted && (
                          <span className="text-xs text-muted-foreground line-through">
                            ${product.compareAtPrice?.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {product.stock > 0 ? (
                        <span className="text-[11px] text-emerald-600 font-medium">
                          In Stock
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-500 font-medium">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
