import { ApiResponseSuccess, ApiResponseError, ApiErrorDetail } from "@veyora/types";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  timeout?: number;
}

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];

  constructor(message: string, statusCode: number, code = "API_ERROR", details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export type AuthTokenProvider = () => string | null | Promise<string | null>;
export type RequestInterceptor = (
  options: RequestOptions
) => RequestOptions | Promise<RequestOptions>;
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export class ApiClient {
  private readonly baseUrl: string;
  private authTokenProvider: AuthTokenProvider | null = null;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:4000/api/v1";
  }

  public setAuthTokenProvider(provider: AuthTokenProvider): void {
    this.authTokenProvider = provider;
  }

  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
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
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        const errorData = data as ApiResponseError | null;
        throw new ApiClientError(
          errorData?.error?.message || response.statusText || "Request failed",
          response.status,
          errorData?.error?.code || "HTTP_ERROR",
          errorData?.error?.details
        );
      }

      // If wrapped in ApiResponseSuccess format, unwrap data
      if (data && typeof data === "object" && "success" in data && data.success === true) {
        return (data as ApiResponseSuccess<T>).data;
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
