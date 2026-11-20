/**
 * Common primitive and domain types for Veyora
 */

export type AppEnvironment = "development" | "test" | "staging" | "production";

export type EntityId = string;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
