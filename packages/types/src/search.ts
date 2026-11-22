import { Product } from "./catalog";
import { PaginationMeta } from "./common";

export type SearchSortOption =
  "relevance" | "price_asc" | "price_desc" | "newest" | "rating" | "popular";

export interface SearchFacetCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface SearchFacetBrand {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface SearchFacetPrice {
  min: number;
  max: number;
  avg?: number;
}

export interface SearchFacets {
  categories: SearchFacetCategory[];
  brands: SearchFacetBrand[];
  price: SearchFacetPrice;
  inStockCount: number;
  outOfStockCount: number;
  ratingCounts?: Record<number, number>;
}

export interface SearchResponse {
  items: Product[];
  meta: PaginationMeta;
  facets?: SearchFacets;
  suggestions?: string[];
  query?: string;
}

export interface SearchSuggestionItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  image?: string;
  categoryName?: string;
}

export interface SearchSuggestionCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SearchSuggestionResponse {
  suggestions: string[];
  products: SearchSuggestionItem[];
  categories: SearchSuggestionCategory[];
}
