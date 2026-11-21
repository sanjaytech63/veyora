"use client";

import * as React from "react";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { useCategories, useBrands, useProducts } from "@/hooks/use-catalog";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShopPage() {
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  // State
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedBrand, setSelectedBrand] = React.useState<string>("all");
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"newest" | "price_asc" | "price_desc" | "title">("newest");
  const [page, setPage] = React.useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Map sort parameter
  const sortParams = React.useMemo(() => {
    if (sortBy === "price_asc") return { sortBy: "price" as const, sortOrder: "asc" as const };
    if (sortBy === "price_desc") return { sortBy: "price" as const, sortOrder: "desc" as const };
    if (sortBy === "title") return { sortBy: "title" as const, sortOrder: "asc" as const };
    return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
  }, [sortBy]);

  const { data, isLoading } = useProducts({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    brandId: selectedBrand === "all" ? undefined : selectedBrand,
    sortBy: sortParams.sortBy,
    sortOrder: sortParams.sortOrder,
  });

  const products = React.useMemo(() => {
    const list = data?.items || [];
    if (!inStockOnly) return list;
    return list.filter((p) => p.stock > 0);
  }, [data?.items, inStockOnly]);

  const totalPages = data?.meta?.totalPages || 1;
  const totalItems = data?.meta?.total || products.length;

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setInStockOnly(false);
    setSortBy("newest");
    setPage(1);
  };

  const hasActiveFilters =
    search !== "" || selectedCategory !== "all" || selectedBrand !== "all" || inStockOnly;

  return (
    <div className="py-8 md:py-12">
      <Container size="xl" className="space-y-8">
        {/* Header Breadcrumb & Title */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Storefront Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Explore Clothing &amp; Haute Couture
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Browse our complete collection of Indian and contemporary fashion, handcrafted kurtis, festive lehengas, everyday essentials, and modern silhouettes.
          </p>
        </div>

        {/* Toolbar: Search, Mobile Filters, and Sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, fabric, or style..."
              className="pl-10 pr-9 rounded-xl border-border/60"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearch("")}
                className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            {/* Mobile Filter Drawer Trigger */}
            <Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden rounded-xl gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="flex h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-6 max-h-[85vh]">
                <DrawerHeader className="px-0 pt-0 pb-4 border-b">
                  <DrawerTitle className="flex items-center justify-between text-lg font-bold">
                    <span>Catalog Filters</span>
                    <DrawerClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </DrawerClose>
                  </DrawerTitle>
                </DrawerHeader>

                <div className="py-6 space-y-6 overflow-y-auto">
                  {/* Category Filter */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Category
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        type="button"
                        variant={selectedCategory === "all" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedCategory("all")}
                        className={cn(
                          "justify-start text-xs rounded-lg font-medium h-9",
                          selectedCategory !== "all" && "text-muted-foreground"
                        )}
                      >
                        All Categories
                      </Button>
                      {categories.map((c) => (
                        <Button
                          key={c.id}
                          type="button"
                          variant={selectedCategory === c.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedCategory(c.id)}
                          className={cn(
                            "justify-start text-xs rounded-lg font-medium h-9",
                            selectedCategory !== c.id && "text-muted-foreground"
                          )}
                        >
                          {c.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Stock Toggle */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <label htmlFor="mobile-stock-toggle" className="text-sm font-medium">
                      In Stock Only
                    </label>
                    <Switch
                      id="mobile-stock-toggle"
                      checked={inStockOnly}
                      onCheckedChange={setInStockOnly}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={handleResetFilters}
                  >
                    Reset All
                  </Button>
                  <Button
                    className="flex-1 rounded-xl"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    Show Results
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs text-muted-foreground whitespace-nowrap">
                Sort by:
              </span>
              <Select
                value={sortBy}
                onValueChange={(val: "newest" | "price_asc" | "price_desc" | "title") => {
                  setSortBy(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] rounded-xl text-xs font-medium border-border/60">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="title">Alphabetical (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Active Filters:</span>
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs">
                Category: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCategory("all")}
                  className="h-4 w-4 p-0 ml-1 hover:text-foreground hover:bg-transparent"
                  aria-label="Remove category filter"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedBrand !== "all" && (
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs">
                Brand: {brands.find((b) => b.id === selectedBrand)?.name || selectedBrand}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedBrand("all")}
                  className="h-4 w-4 p-0 ml-1 hover:text-foreground hover:bg-transparent"
                  aria-label="Remove brand filter"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {inStockOnly && (
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs">
                In Stock Only
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setInStockOnly(false)}
                  className="h-4 w-4 p-0 ml-1 hover:text-foreground hover:bg-transparent"
                  aria-label="Remove in-stock filter"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {search && (
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs">
                Query: &ldquo;{search}&rdquo;
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearch("")}
                  className="h-4 w-4 p-0 ml-1 hover:text-foreground hover:bg-transparent"
                  aria-label="Clear search query"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-primary p-0 h-auto ml-2 hover:underline"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Main Grid & Desktop Filter Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-8 pr-4">
            {/* Categories */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Fashion Categories
              </h3>
              <div className="space-y-1">
                <Button
                  type="button"
                  variant={selectedCategory === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setPage(1);
                  }}
                  className={cn(
                    "w-full justify-between rounded-xl px-3 text-xs font-medium h-9",
                    selectedCategory !== "all" && "text-muted-foreground"
                  )}
                >
                  <span>All Products</span>
                </Button>
                {categories.map((c) => (
                  <Button
                    key={c.id}
                    type="button"
                    variant={selectedCategory === c.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setPage(1);
                    }}
                    className={cn(
                      "w-full justify-between rounded-xl px-3 text-xs font-medium h-9",
                      selectedCategory !== c.id && "text-muted-foreground"
                    )}
                  >
                    <span>{c.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Brands */}
            {brands.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Fashion Houses &amp; Labels
                </h3>
                <div className="space-y-1">
                  <Button
                    type="button"
                    variant={selectedBrand === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setSelectedBrand("all");
                      setPage(1);
                    }}
                    className={cn(
                      "w-full justify-between rounded-xl px-3 text-xs font-medium h-9",
                      selectedBrand !== "all" && "text-muted-foreground"
                    )}
                  >
                    <span>All Brands</span>
                  </Button>
                  {brands.map((b) => (
                    <Button
                      key={b.id}
                      type="button"
                      variant={selectedBrand === b.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedBrand(b.id);
                        setPage(1);
                      }}
                      className={cn(
                        "w-full justify-between rounded-xl px-3 text-xs font-medium h-9",
                        selectedBrand !== b.id && "text-muted-foreground"
                      )}
                    >
                      <span>{b.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Status Filter */}
            <div className="pt-4 border-t border-border/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Availability
              </h3>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="desktop-instock-toggle"
                  className="text-xs font-medium text-muted-foreground cursor-pointer"
                >
                  In Stock Only
                </label>
                <Switch
                  id="desktop-instock-toggle"
                  checked={inStockOnly}
                  onCheckedChange={(checked) => {
                    setInStockOnly(checked);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing <strong className="text-foreground">{products.length}</strong> of{" "}
                <strong className="text-foreground">{totalItems}</strong> products
              </span>
            </div>

            <ProductGrid
              products={products}
              categories={categories}
              loading={isLoading}
              columns={3}
              onResetFilters={handleResetFilters}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-xl text-xs"
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <Button
                      key={pNum}
                      variant={page === pNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPage(pNum)}
                      className="h-8 w-8 rounded-xl p-0 text-xs font-semibold"
                    >
                      {pNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl text-xs"
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}
