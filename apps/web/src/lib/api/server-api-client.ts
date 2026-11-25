import { cookies } from "next/headers";
import {
  Product,
  Category,
  Collection,
  Brand,
  ApiResponseSuccess,
  ApiResponseError,
} from "@veyora/types";
import { ProductQueryInput } from "@veyora/validators";

// Runtime assertion to prevent accidental bundling into Client Components
if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
  throw new Error("server-api-client cannot be imported or executed in a Client Component.");
}

export class ServerApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code = "SERVER_API_ERROR", details?: unknown) {
    super(message);
    this.name = "ServerApiClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  public isNotFound(): boolean {
    return this.statusCode === 404 || this.code === "NOT_FOUND";
  }

  public isUnauthorized(): boolean {
    return this.statusCode === 401 || this.code === "UNAUTHORIZED";
  }

  public isForbidden(): boolean {
    return this.statusCode === 403 || this.code === "FORBIDDEN";
  }
}

export interface ServerRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  timeout?: number;
  requireAuth?: boolean;
  forwardCookies?: boolean;
}

/**
 * Resolves the backend API base URL with server-side priority:
 * 1. INTERNAL_API_URL (e.g. Docker container networking http://api:4000/api/v1)
 * 2. API_URL (standard server environment)
 * 3. NEXT_PUBLIC_API_URL (fallback)
 * 4. http://localhost:4000/api/v1 (local default)
 */
export function getServerApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api/v1"
  );
}

/**
 * Safely forwards authenticated cookies (refreshToken, guest_id) from the incoming Next.js request.
 */
async function getForwardedCookieHeader(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const forwarded: string[] = [];

    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (refreshToken) {
      forwarded.push(`refreshToken=${refreshToken}`);
    }

    const guestId = cookieStore.get("guest_id")?.value;
    if (guestId) {
      forwarded.push(`guest_id=${guestId}`);
    }

    return forwarded.join("; ");
  } catch {
    // If called outside request context (e.g. during static generation), gracefully return empty
    return "";
  }
}

/**
 * Core server-side HTTP fetch function for Server Components and Server Actions.
 */
export async function serverFetch<T>(
  endpoint: string,
  options: ServerRequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
    params,
    headers: customHeaders = {},
    timeout = 8000,
    requireAuth = false,
  } = options;

  const baseUrl = getServerApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${baseUrl}${cleanEndpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  let cookieHeader = "";
  const authToken = token;

  // Next.js 16 "use cache" forbids reading dynamic request cookies() inside cached functions.
  // We only access cookies() when authentication/session cookies are explicitly required or requested,
  // and only if a token was not already provided directly by the caller.
  const shouldAccessCookies = Boolean(options.forwardCookies || (requireAuth && !authToken));

  if (shouldAccessCookies) {
    cookieHeader = await getForwardedCookieHeader();
  }

  if (requireAuth && !authToken && !cookieHeader.includes("refreshToken=")) {
    throw new ServerApiClientError(
      "Unauthenticated: active session required for server operation",
      401,
      "UNAUTHORIZED"
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestHeaders = new Headers({
    Accept: "application/json",
    ...customHeaders,
  });

  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  if (cookieHeader) {
    requestHeaders.set("Cookie", cookieHeader);
  }

  let requestBody: string | undefined = undefined;
  if (body !== undefined && body !== null && method !== "GET") {
    requestBody = JSON.stringify(body);
    requestHeaders.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!response.ok) {
      let errorMessage = `Server API request failed with HTTP ${response.status} (${response.statusText})`;
      let errorCode = "API_ERROR";
      let errorDetails: unknown = undefined;

      if (isJson) {
        try {
          const errorPayload = (await response.json()) as ApiResponseError;
          if (errorPayload && errorPayload.error) {
            errorMessage = errorPayload.error.message || errorMessage;
            errorCode = errorPayload.error.code || errorCode;
            errorDetails = errorPayload.error.details;
          }
        } catch {
          // Fall back to HTTP status message
        }
      }

      throw new ServerApiClientError(errorMessage, response.status, errorCode, errorDetails);
    }

    if (!isJson) {
      return (await response.text()) as unknown as T;
    }

    const json = await response.json();
    // Handle standard Veyora API envelope { success: true, data: T }
    if (json && typeof json === "object" && "data" in json) {
      return (json as ApiResponseSuccess<T>).data;
    }

    return json as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ServerApiClientError) {
      throw err;
    }

    if (err instanceof Error && err.name === "AbortError") {
      throw new ServerApiClientError(
        `Server API request to ${cleanEndpoint} timed out after ${timeout}ms`,
        504,
        "GATEWAY_TIMEOUT"
      );
    }

    const message = err instanceof Error ? err.message : "Unknown server network failure";
    throw new ServerApiClientError(
      `Network failure communicating with backend service at ${cleanEndpoint}: ${message}`,
      503,
      "SERVICE_UNAVAILABLE"
    );
  }
}

/**
 * Typed domain-level Server Data Services for `@veyora/web`.
 * Safe for direct consumption in Next.js Server Components.
 */
export const serverCatalog = {
  getProducts: async (params?: Partial<ProductQueryInput>): Promise<Product[]> => {
    try {
      const data = await serverFetch<Product[]>("/products", {
        params: params as Record<string, string | number | boolean | undefined | null>,
        requireAuth: false,
        forwardCookies: false,
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getFeaturedProducts: async (limit = 4): Promise<Product[]> => {
    try {
      const prods = await serverCatalog.getProducts({ limit: 12 });
      const featured = prods.filter((p) => p.tags?.includes("featured") || p.status === "active");
      return (featured.length > 0 ? featured : prods).slice(0, limit);
    } catch {
      return [];
    }
  },

  getProductBySlug: async (idOrSlug: string): Promise<Product | null> => {
    try {
      const product = await serverFetch<Product>(`/products/${idOrSlug}`, {
        requireAuth: false,
        forwardCookies: false,
      });
      if (product && (product.id || (product as unknown as { _id?: string })._id)) {
        return product;
      }
      return null;
    } catch (err) {
      if (err instanceof ServerApiClientError && err.isNotFound()) {
        return null;
      }
      throw err;
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const categories = await serverFetch<Category[]>("/categories", {
        requireAuth: false,
        forwardCookies: false,
      });
      return Array.isArray(categories) ? categories : [];
    } catch {
      return [];
    }
  },

  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const category = await serverFetch<Category>(`/categories/${slug}`, {
        requireAuth: false,
        forwardCookies: false,
      });
      return category && category.slug ? category : null;
    } catch (err) {
      if (err instanceof ServerApiClientError && err.isNotFound()) {
        return null;
      }
      throw err;
    }
  },

  getCollections: async (): Promise<Collection[]> => {
    try {
      const collections = await serverFetch<Collection[]>("/collections", {
        requireAuth: false,
        forwardCookies: false,
      });
      return Array.isArray(collections) ? collections : [];
    } catch {
      return [];
    }
  },

  getCollectionBySlug: async (slug: string): Promise<Collection | null> => {
    try {
      const collection = await serverFetch<Collection>(`/collections/${slug}`, {
        requireAuth: false,
        forwardCookies: false,
      });
      return collection && collection.slug ? collection : null;
    } catch (err) {
      if (err instanceof ServerApiClientError && err.isNotFound()) {
        return null;
      }
      throw err;
    }
  },

  getBrands: async (): Promise<Brand[]> => {
    try {
      const brands = await serverFetch<Brand[]>("/brands", {
        requireAuth: false,
        forwardCookies: false,
      });
      return Array.isArray(brands) ? brands : [];
    } catch {
      return [];
    }
  },
};
