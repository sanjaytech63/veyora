"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSearch, useSearchSuggestions, useCategories } from "@/hooks/use-catalog";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  normalizeSearchQuery,
} from "./search.utils";
import { SearchNavigationItem } from "./search.types";

export function useProductSearch(onClose?: () => void) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  // Debounce search query input (300ms delay to prevent excessive network calls)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(normalizeSearchQuery(query));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Load recent searches on mount
  React.useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // TanStack Query Hooks with automatic request cancellation
  const { data: suggestionsData, isLoading: suggestionsLoading } =
    useSearchSuggestions(debouncedQuery);
  const {
    data: products = [],
    isLoading: productsLoading,
    isError,
    refetch,
  } = useSearch(debouncedQuery);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const activeCategories = React.useMemo(() => {
    return categories.filter((c) => c.status === "active").slice(0, 6);
  }, [categories]);

  // Flatten currently visible selectable items for Arrow key navigation
  const navigationItems = React.useMemo<SearchNavigationItem[]>(() => {
    const items: SearchNavigationItem[] = [];

    if (!debouncedQuery) {
      recentSearches.forEach((term, idx) => {
        items.push({
          id: `recent-${idx}`,
          type: "recent",
          title: term,
        });
      });
      activeCategories.forEach((cat) => {
        items.push({
          id: `cat-${cat.id}`,
          type: "category",
          title: cat.name,
          url: `/category/${cat.slug}`,
        });
      });
      return items;
    }

    // Suggestions
    suggestionsData?.suggestions?.forEach((sug, idx) => {
      items.push({
        id: `sug-${idx}`,
        type: "suggestion",
        title: sug,
      });
    });

    // Categories
    suggestionsData?.categories?.forEach((cat) => {
      items.push({
        id: `cat-match-${cat.id}`,
        type: "category",
        title: cat.name,
        url: `/category/${cat.slug}`,
      });
    });

    // Products
    products.forEach((prod) => {
      items.push({
        id: `prod-${prod.id}`,
        type: "product",
        title: prod.title,
        url: `/products/${prod.slug}`,
        product: prod,
      });
    });

    return items;
  }, [debouncedQuery, recentSearches, activeCategories, suggestionsData, products]);

  // Reset active index when query or items change
  React.useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleExecuteSearch = (searchQuery: string) => {
    const normalized = normalizeSearchQuery(searchQuery);
    if (!normalized) return;

    addRecentSearch(normalized);
    setRecentSearches(getRecentSearches());
    onClose?.();
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  };

  const handleSelectProduct = (slug: string, title: string) => {
    addRecentSearch(title);
    setRecentSearches(getRecentSearches());
    onClose?.();
    router.push(`/products/${slug}`);
  };

  const handleSelectCategory = (slug: string, name: string) => {
    addRecentSearch(name);
    setRecentSearches(getRecentSearches());
    onClose?.();
    router.push(`/category/${slug}`);
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (navigationItems.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        handleExecuteSearch(query);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < navigationItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : navigationItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < navigationItems.length) {
        const item = navigationItems[activeIndex];
        if (item) {
          if (item.type === "recent" || item.type === "suggestion") {
            setQuery(item.title);
            handleExecuteSearch(item.title);
          } else if (item.url) {
            addRecentSearch(item.title);
            setRecentSearches(getRecentSearches());
            onClose?.();
            router.push(item.url);
          }
        }
      } else if (query.trim()) {
        handleExecuteSearch(query);
      }
    }
  };

  const isLoading =
    (query.trim().length > 1 && (productsLoading || suggestionsLoading)) ||
    (query.trim().length === 0 && categoriesLoading);

  return {
    query,
    setQuery,
    debouncedQuery,
    products,
    suggestions: suggestionsData?.suggestions || [],
    suggestedCategories: suggestionsData?.categories || [],
    activeCategories,
    recentSearches,
    activeIndex,
    navigationItems,
    isLoading,
    isError,
    refetch,
    handleKeyDown,
    handleSelectRecent,
    handleRemoveRecent,
    handleClearAllRecent,
    handleExecuteSearch,
    handleSelectProduct,
    handleSelectCategory,
  };
}
