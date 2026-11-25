import { cookies } from "next/headers";
import { AuthUser, Product, OrderDto, ApiResponseSuccess, ApiResponseError } from "@veyora/types";

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
 * 1. INTERNAL_API_URL (e.g. internal network http://api:4000/api/v1)
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
 * Safely forwards administrative session cookies from the incoming Next.js request.
 */
async function getForwardedAdminCookieHeader(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const forwarded: string[] = [];

    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (refreshToken) {
      forwarded.push(`refreshToken=${refreshToken}`);
    }

    return forwarded.join("; ");
  } catch {
    return "";
  }
}

/**
 * Core server-side HTTP fetch function for Admin Server Components and Server Actions.
 */
export async function serverAdminFetch<T>(
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
    requireAuth = true,
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

  const shouldAccessCookies = Boolean(options.forwardCookies || (requireAuth && !authToken));

  if (shouldAccessCookies) {
    cookieHeader = await getForwardedAdminCookieHeader();
  }

  if (requireAuth && !authToken && !cookieHeader.includes("refreshToken=")) {
    throw new ServerApiClientError(
      "Unauthenticated: active administrator session required for server operation",
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
          // Fall back to HTTP status
        }
      }

      throw new ServerApiClientError(errorMessage, response.status, errorCode, errorDetails);
    }

    if (!isJson) {
      return (await response.text()) as unknown as T;
    }

    const json = await response.json();
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
 * Typed domain-level Server Data Services for `@veyora/admin`.
 * Safe for direct consumption in Next.js Server Components.
 */
export const serverAdminApi = {
  getProduct: async (id: string): Promise<Product | null> => {
    try {
      const product = await serverAdminFetch<Product>(`/admin/catalog/products/${id}`);
      return product && product.id ? product : null;
    } catch (err) {
      if (err instanceof ServerApiClientError && err.isNotFound()) {
        return null;
      }
      throw err;
    }
  },

  getOrder: async (id: string): Promise<OrderDto | null> => {
    try {
      const order = await serverAdminFetch<OrderDto>(`/admin/orders/${id}`);
      return order && order.id ? order : null;
    } catch (err) {
      if (err instanceof ServerApiClientError && err.isNotFound()) {
        return null;
      }
      throw err;
    }
  },

  getCustomer: async (id: string): Promise<AuthUser | null> => {
    try {
      const customer = await serverAdminFetch<AuthUser>(`/admin/customers/${id}`);
      return customer && customer.id ? customer : null;
    } catch (err) {
      if (err instanceof ServerApiClientError && err.isNotFound()) {
        return null;
      }
      throw err;
    }
  },
};
