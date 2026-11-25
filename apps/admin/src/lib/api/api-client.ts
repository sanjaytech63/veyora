import { ApiResponseSuccess, ApiResponseError, ApiErrorDetail } from "@veyora/types";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  timeout?: number;
  raw?: boolean;
  preserveEnvelope?: boolean;
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];
  public readonly requestId?: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(
    message: string,
    statusCode: number,
    code = "API_ERROR",
    details?: ApiErrorDetail[],
    requestId?: string
  ) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.isNetworkError = statusCode === 0 && code === "NETWORK_ERROR";
    this.isTimeout = code === "TIMEOUT";
  }
}

const apiSuccessMetadata = new WeakMap<
  object,
  { code?: string; message?: string; meta?: Record<string, unknown> }
>();
let lastApiSuccessMetadata:
  { code?: string; message?: string; meta?: Record<string, unknown> } | undefined;

export function getApiSuccessMetadata(
  value: unknown
): { code?: string; message?: string; meta?: Record<string, unknown> } | undefined {
  if (typeof value === "object" && value !== null) {
    return apiSuccessMetadata.get(value) ?? lastApiSuccessMetadata;
  }
  return lastApiSuccessMetadata;
}

export type AuthTokenProvider = () => string | null | Promise<string | null>;
export type RequestInterceptor = (
  options: RequestOptions
) => RequestOptions | Promise<RequestOptions>;
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
export type RefreshTokenHandler = () => Promise<string | null>;
export type SessionExpiredHandler = () => void;

export class ApiClient {
  private readonly baseUrl: string;
  private authTokenProvider: AuthTokenProvider | null = null;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private refreshPromise: Promise<string | null> | null = null;
  private refreshTokenHandler: RefreshTokenHandler | null = null;
  private onSessionExpiredHandler: SessionExpiredHandler | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  }

  public setAuthTokenProvider(provider: AuthTokenProvider): void {
    this.authTokenProvider = provider;
  }

  public setRefreshTokenHandler(handler: RefreshTokenHandler): void {
    this.refreshTokenHandler = handler;
  }

  public setOnSessionExpired(handler: SessionExpiredHandler): void {
    this.onSessionExpiredHandler = handler;
  }

  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private isAuthEndpoint(endpoint: string): boolean {
    const clean = endpoint.toLowerCase();
    return (
      clean.includes("/auth/login") ||
      clean.includes("/auth/register") ||
      clean.includes("/auth/refresh") ||
      clean.includes("/auth/verify-email") ||
      clean.includes("/auth/resend-otp") ||
      clean.includes("/auth/forgot-password") ||
      clean.includes("/auth/reset-password") ||
      clean.includes("/auth/logout")
    );
  }

  private async executeTokenRefresh(): Promise<string | null> {
    try {
      if (this.refreshTokenHandler) {
        return await this.refreshTokenHandler();
      }

      // Default built-in refresh fallback
      const refreshUrl = this.buildUrl("/auth/refresh");
      const res = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      return data?.data?.accessToken || data?.accessToken || null;
    } catch {
      return null;
    }
  }

  private async handleTokenRefreshAndRetry<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    // Single-flight deduplication mutex: reuse active in-flight refresh promise
    if (!this.refreshPromise) {
      this.refreshPromise = this.executeTokenRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }

    const newToken = await this.refreshPromise;
    if (!newToken) {
      this.onSessionExpiredHandler?.();
      throw new ApiClientError("Authentication session expired", 401, "SESSION_EXPIRED");
    }

    // Retry the original request with _retry: true to prevent infinite loops
    return this.request<T>(endpoint, {
      ...options,
      _retry: true,
    });
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let finalOptions = { ...options };

    for (const interceptor of this.requestInterceptors) {
      finalOptions = await interceptor(finalOptions);
    }

    const { params, body, headers: customHeaders, timeout = 15000, ...fetchOptions } = finalOptions;

    const url = this.buildUrl(endpoint, params);
    const headers = new Headers(customHeaders);

    headers.set("Accept", "application/json");

    if (body && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (this.authTokenProvider) {
      const token = await this.authTokenProvider();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let response = await fetch(url, {
        credentials: "include",
        ...fetchOptions,
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const data = isJson
        ? await response.json()
        : await (async () => {
            const contentType = response.headers.get("content-type") || "";
            if (
              contentType.includes("text/") ||
              contentType.includes("csv") ||
              contentType.includes("xml")
            ) {
              return await response.text();
            }
            return await response.blob();
          })();

      if (!response.ok) {
        // Automatic 401 token refresh and single retry
        if (
          response.status === 401 &&
          !options._retry &&
          !options.skipAuthRefresh &&
          !this.isAuthEndpoint(endpoint)
        ) {
          return await this.handleTokenRefreshAndRetry<T>(endpoint, options);
        }

        const errorData = data as ApiResponseError | null;
        const canonical = data as {
          code?: string;
          message?: string;
          meta?: { requestId?: string };
          details?: ApiErrorDetail[];
        } | null;
        const requestId =
          canonical?.meta?.requestId || response.headers.get("x-request-id") || undefined;
        throw new ApiClientError(
          canonical?.message ||
            errorData?.error?.message ||
            errorData?.message ||
            response.statusText ||
            "Request failed",
          response.status,
          canonical?.code || errorData?.error?.code || errorData?.code || "HTTP_ERROR",
          canonical?.details || errorData?.error?.details || errorData?.details,
          requestId
        );
      }

      if (options.raw || options.preserveEnvelope) {
        return data as T;
      }

      // If wrapped in ApiResponseSuccess format, unwrap data
      if (data && typeof data === "object" && "success" in data && data.success === true) {
        const envelope = data as ApiResponseSuccess<T>;
        lastApiSuccessMetadata = {
          code: envelope.code,
          message: envelope.message,
          meta: envelope.meta,
        };
        const unwrapped = envelope.data;
        if (typeof unwrapped === "object" && unwrapped !== null) {
          apiSuccessMetadata.set(unwrapped, {
            code: envelope.code,
            message: envelope.message,
            meta: envelope.meta,
          });
        }
        return unwrapped as T;
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiClientError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiClientError("Request timeout exceeded", 408, "TIMEOUT");
      }
      throw new ApiClientError(
        error instanceof Error ? error.message : "Network error encountered",
        0,
        "NETWORK_ERROR"
      );
    }
  }

  public get<T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public getWithMeta<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body" | "raw">
  ): Promise<ApiResponseSuccess<T>> {
    return this.request<ApiResponseSuccess<T>>(endpoint, { ...options, method: "GET", raw: true });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  public put<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  public patch<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  public delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
