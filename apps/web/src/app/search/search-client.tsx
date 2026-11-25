"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
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
import { ProductGrid } from "@/components/storefront/product-grid";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  useSearchCatalog,
  useSearchSuggestions,
  useCategories,
  useBrands,
} from "@/hooks/use-catalog";
import { SearchSortOption } from "@veyora/types";
import {
  Search,
  X,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Read initial params from URL
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialBrand = searchParams.get("brand") || "all";
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialSort = (searchParams.get("sort") as SearchSortOption) || "relevance";

  // State
  const [inputVal, setInputVal] = React.useState(initialQuery);
  const [activeQuery, setActiveQuery] = React.useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>(initialCategory);
  const [selectedBrand, setSelectedBrand] = React.useState<string>(initialBrand);
  const [minPriceInput, setMinPriceInput] = React.useState<string>("");
  const [maxPriceInput, setMaxPriceInput] = React.useState<string>("");
  const [appliedMinPrice, setAppliedMinPrice] = React.useState<number | undefined>(undefined);
  const [appliedMaxPrice, setAppliedMaxPrice] = React.useState<number | undefined>(undefined);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [minRating, setMinRating] = React.useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<SearchSortOption>(initialSort);
  const [page, setPage] = React.useState(initialPage);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const searchBoxRef = React.useRef<HTMLDivElement>(null);

  // Debounced input for autocomplete suggestions
  const [debouncedInput, setDebouncedInput] = React.useState(inputVal);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(inputVal), 250);
    return () => clearTimeout(timer);
  }, [inputVal]);

  // Load suggestions
  const { data: suggestionData } = useSearchSuggestions(debouncedInput);
  const { data: allCategories = [] } = useCategories();
  const { data: allBrands = [] } = useBrands();
  const visibleSuggestions = isHydrated ? suggestionData : undefined;
  const visibleCategories = isHydrated ? allCategories : [];
  const visibleBrands = isHydrated ? allBrands : [];

  const popularTerms = React.useMemo(() => {
    return visibleCategories.slice(0, 6).map((c) => c.name);
  }, [visibleCategories]);

  // Execute advanced search
  const {
    data: searchResult,
    isLoading,
    isFetching,
  } = useSearchCatalog({
    q: activeQuery || undefined,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    brandId: selectedBrand === "all" ? undefined : selectedBrand,
    minPrice: appliedMinPrice,
    maxPrice: appliedMaxPrice,
    inStock: inStockOnly ? true : undefined,
    minRating,
    sortBy,
    page,
    limit: 12,
  });

  const visibleSearchResult = isHydrated ? searchResult : undefined;
  const products = visibleSearchResult?.items || [];
  const meta = visibleSearchResult?.meta || {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
  const facets = visibleSearchResult?.facets;
  const visibleIsLoading = isHydrated ? isLoading : true;
  const visibleIsFetching = isHydrated ? isFetching : false;

  // Sync state with URL
  const updateUrl = React.useCallback(
    (qVal: string, p = 1) => {
      const params = new URLSearchParams();
      if (qVal) params.set("q", qVal);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedBrand !== "all") params.set("brand", selectedBrand);
      if (sortBy !== "relevance") params.set("sort", sortBy);
      if (p > 1) params.set("page", String(p));
      const queryString = params.toString();
      router.push(queryString ? `/search?${queryString}` : "/search");
    },
    [router, selectedCategory, selectedBrand, sortBy]
  );

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    setActiveQuery(trimmed);
    setShowSuggestions(false);
    setPage(1);
    updateUrl(trimmed, 1);
  };

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestedTerm = (term: string) => {
    setInputVal(term);
    setActiveQuery(term);
    setShowSuggestions(false);
    setPage(1);
    updateUrl(term, 1);
  };

  const handleApplyPrice = () => {
    const min = minPriceInput ? Number(minPriceInput) : undefined;
    const max = maxPriceInput ? Number(maxPriceInput) : undefined;
    setAppliedMinPrice(min);
    setAppliedMaxPrice(max);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedBrand("all");
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedMinPrice(undefined);
    setAppliedMaxPrice(undefined);
    setInStockOnly(false);
    setMinRating(undefined);
    setSortBy("relevance");
    setPage(1);
    updateUrl(activeQuery, 1);
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedBrand !== "all" ||
    appliedMinPrice !== undefined ||
    appliedMaxPrice !== undefined ||
    inStockOnly ||
    minRating !== undefined ||
    sortBy !== "relevance";

  // Category map for label lookups
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    visibleCategories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [visibleCategories]);

  // Brand map for label lookups
  const brandMap = React.useMemo(() => {
    const map = new Map<string, string>();
    visibleBrands.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [visibleBrands]);

  // Render filter content shared by desktop and mobile drawer
  const renderFilterControls = () => (
    <div className="space-y-6 text-sm">
      {/* Category Facet Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setPage(1);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-foreground hover:bg-muted"
            )}
          >
            <span>All Categories</span>
          </button>
          {facets?.categories && facets.categories.length > 0
            ? facets.categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="truncate">{cat.name}</span>
                  <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                    {cat.count}
                  </Badge>
                </button>
              ))
            : visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
        </div>
      </div>

      {/* Brand Facet Filter */}
      {((facets?.brands && facets.brands.length > 0) || visibleBrands.length > 0) && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Brand
          </label>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => {
                setSelectedBrand("all");
                setPage(1);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                selectedBrand === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>All Brands</span>
            </button>
            {facets?.brands && facets.brands.length > 0
              ? facets.brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBrand(b.id);
                      setPage(1);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                      selectedBrand === b.id
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="truncate">{b.name}</span>
                    <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                      {b.count}
                    </Badge>
                  </button>
                ))
              : visibleBrands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBrand(b.id);
                      setPage(1);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                      selectedBrand === b.id
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="truncate">{b.name}</span>
                  </button>
                ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Price Range ($)
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="h-8 text-xs"
            min={0}
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="h-8 text-xs"
            min={0}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyPrice}
            className="h-8 px-2 text-xs"
          >
            Go
          </Button>
        </div>
      </div>

      {/* In-stock toggle */}
      <div className="flex items-center justify-between pt-1">
        <label
          htmlFor="in-stock-filter"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
        >
          In Stock Only
        </label>
        <Switch
          id="in-stock-filter"
          checked={inStockOnly}
          onCheckedChange={(checked) => {
            setInStockOnly(checked);
            setPage(1);
          }}
        />
      </div>

      {/* Rating Filter */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Minimum Rating
        </label>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant={minRating === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMinRating(undefined);
              setPage(1);
            }}
            className="h-7 text-xs px-2.5 rounded-full"
          >
            All
          </Button>
          <Button
            type="button"
            variant={minRating === 4 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMinRating(minRating === 4 ? undefined : 4);
              setPage(1);
            }}
            className="h-7 text-xs px-2.5 rounded-full inline-flex items-center gap-1"
          >
            4★ & up
          </Button>
          <Button
            type="button"
            variant={minRating === 3 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMinRating(minRating === 3 ? undefined : 3);
              setPage(1);
            }}
            className="h-7 text-xs px-2.5 rounded-full inline-flex items-center gap-1"
          >
            3★ & up
          </Button>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="w-full text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 pt-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="py-8 md:py-16 space-y-10">
      <Container size="xl" className="space-y-8">
        {/* Search Header Banner */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Precision Discovery Engine
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Search Veyora Atelier
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Discover handcrafted minimalist couture, acoustic listening gear, mechanical
            instruments, and tactile desk accessories.
          </p>

          {/* Interactive Search Box & Autocomplete */}
          <div ref={searchBoxRef} className="relative mt-6 max-w-2xl mx-auto text-left">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search by product name, SKU, tags, or specifications..."
                className="pl-12 pr-24 py-6 text-base rounded-2xl border-border/80 shadow-md bg-card focus-visible:ring-primary/40"
                autoFocus
              />
              <div className="absolute right-3 flex items-center gap-1">
                {inputVal && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setInputVal("");
                      setActiveQuery("");
                      setShowSuggestions(false);
                      setPage(1);
                      updateUrl("", 1);
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button type="submit" size="sm" className="h-8 rounded-xl px-3 text-xs">
                  Search
                </Button>
              </div>
            </form>

            {/* Autocomplete / Instant Suggestions Dropdown */}
            {showSuggestions && debouncedInput.trim().length > 0 && visibleSuggestions && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-card/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-2xl p-4 space-y-4 animate-in fade-in-50 zoom-in-95">
                {/* Matching Category Links */}
                {(visibleSuggestions.categories?.length ?? 0) > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {visibleSuggestions.categories?.map((c) => (
                        <Link
                          key={c.id}
                          href={`/category/${c.slug}`}
                          onClick={() => setShowSuggestions(false)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
                        >
                          <Tag className="h-3 w-3" />
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Term Suggestions */}
                {(visibleSuggestions.suggestions?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Search Suggestions
                    </span>
                    <div className="space-y-0.5">
                      {visibleSuggestions.suggestions?.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleSelectSuggestedTerm(term)}
                          className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                        >
                          <Search className="h-3 w-3 text-muted-foreground" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Matching Product Previews */}
                {(visibleSuggestions.products?.length ?? 0) > 0 && (
                  <div className="space-y-2 border-t border-border/60 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Product Matches
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {visibleSuggestions.products?.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => setShowSuggestions(false)}
                          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-muted/60 transition-colors group"
                        >
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted/40">
                            {p.image ? (
                              <OptimizedImage
                                src={p.image}
                                alt={p.title}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary">
                              {p.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              ${p.price.toFixed(2)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Popular Suggestions Pills */}
            {isHydrated && popularTerms.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Popular:
                </span>
                {popularTerms.map((term) => (
                  <Button
                    key={term}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectSuggestedTerm(term)}
                    className="rounded-full border-border/60 bg-muted/30 px-3 h-7 text-xs font-medium text-foreground hover:bg-accent hover:border-primary/40 transition-colors"
                  >
                    {term}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Layout: Filters Sidebar + Grid */}
        <div className="pt-6 border-t border-border/60">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6 bg-card/40 p-5 rounded-2xl border border-border/60 h-fit sticky top-24">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
                </span>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-6 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
                  >
                    Reset
                  </Button>
                )}
              </div>
              {renderFilterControls()}
            </aside>

            {/* Main Results Column */}
            <main className="flex-1 space-y-6">
              {/* Controls Toolbar: Results count, Active pills, Sort, Mobile filter drawer button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 p-4 rounded-2xl border border-border/60">
                <div className="space-y-1">
                  <div className="text-sm text-foreground font-medium">
                    {activeQuery ? (
                      <>
                        Results for &ldquo;
                        <span className="font-bold text-primary">{activeQuery}</span>&rdquo;
                      </>
                    ) : (
                      "All Storefront Products"
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Showing {products.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}–
                    {Math.min(meta.total, meta.page * meta.limit)} of {meta.total} products
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile Filters Drawer Trigger */}
                  <div className="lg:hidden">
                    <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                      <DrawerTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Filters {hasActiveFilters && "•"}
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                        <DrawerHeader className="p-0">
                          <DrawerTitle className="text-base font-bold flex items-center justify-between">
                            <span>Filter Catalog</span>
                            <DrawerClose asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <X className="h-4 w-4" />
                              </Button>
                            </DrawerClose>
                          </DrawerTitle>
                        </DrawerHeader>
                        {renderFilterControls()}
                      </DrawerContent>
                    </Drawer>
                  </div>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground hidden sm:inline">Sort:</span>
                    <Select
                      value={sortBy}
                      onValueChange={(val) => {
                        setSortBy(val as SearchSortOption);
                        setPage(1);
                        updateUrl(activeQuery, 1);
                      }}
                    >
                      <SelectTrigger className="h-9 w-[150px] text-xs rounded-xl">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="newest">Newest Arrivals</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Active:</span>
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs py-1">
                      Category: {categoryMap.get(selectedCategory) || selectedCategory}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                        className="hover:opacity-75"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedBrand !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs py-1">
                      Brand: {brandMap.get(selectedBrand) || selectedBrand}
                      <button
                        type="button"
                        onClick={() => setSelectedBrand("all")}
                        className="hover:opacity-75"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {(appliedMinPrice !== undefined || appliedMaxPrice !== undefined) && (
                    <Badge variant="secondary" className="gap-1 text-xs py-1">
                      Price: ${appliedMinPrice ?? 0} – ${appliedMaxPrice ?? "∞"}
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedMinPrice(undefined);
                          setAppliedMaxPrice(undefined);
                          setMinPriceInput("");
                          setMaxPriceInput("");
                        }}
                        className="hover:opacity-75"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {inStockOnly && (
                    <Badge variant="secondary" className="gap-1 text-xs py-1">
                      In Stock Only
                      <button
                        type="button"
                        onClick={() => setInStockOnly(false)}
                        className="hover:opacity-75"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {minRating && (
                    <Badge variant="secondary" className="gap-1 text-xs py-1">
                      {minRating}★ & above
                      <button
                        type="button"
                        onClick={() => setMinRating(undefined)}
                        className="hover:opacity-75"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                </div>
              )}

              {/* Product Grid */}
              <div className="relative">
                {visibleIsFetching && !visibleIsLoading && (
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs">
                    <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    Updating...
                  </div>
                )}
                <ProductGrid
                  products={products}
                  categories={visibleCategories}
                  loading={visibleIsLoading}
                  columns={3}
                  emptyTitle={
                    activeQuery
                      ? `No products found for "${activeQuery}"`
                      : "No products matched the selected filters"
                  }
                  emptyDescription={
                    activeQuery
                      ? "Try checking your spelling, removing filter constraints, or searching by broader keywords like 'audio', 'keyboard', or 'mat'."
                      : "Try loosening your price or category filters to see more products."
                  }
                />
              </div>

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasPrevPage}
                    onClick={() => {
                      const nextP = page - 1;
                      setPage(nextP);
                      updateUrl(activeQuery, nextP);
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                    className="gap-1 text-xs"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {/* Page indicator pills */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        return p === 1 || p === meta.totalPages || (p >= page - 1 && p <= page + 1);
                      })
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && (
                              <span className="px-1 text-xs text-muted-foreground">...</span>
                            )}
                            <Button
                              type="button"
                              variant={p === page ? "default" : "ghost"}
                              size="sm"
                              onClick={() => {
                                setPage(p);
                                updateUrl(activeQuery, p);
                                window.scrollTo({ top: 200, behavior: "smooth" });
                              }}
                              className="h-8 w-8 text-xs p-0 rounded-xl"
                            >
                              {p}
                            </Button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasNextPage}
                    onClick={() => {
                      const nextP = page + 1;
                      setPage(nextP);
                      updateUrl(activeQuery, nextP);
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                    className="gap-1 text-xs"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </Container>
    </div>
  );
}
