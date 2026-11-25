import { MutationCache, QueryClient } from "@tanstack/react-query";
import { ApiClientError } from "./api-client";
import { notifyApiError } from "@/lib/notifications";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        const meta = mutation.options.meta as { notifyError?: boolean } | undefined;
        if (meta?.notifyError === true) {
          notifyApiError(error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes default
        gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
        retry: (failureCount, error) => {
          // Never retry client errors (4xx), such as 400 Bad Request, 401 Unauthorized,
          // 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity
          if (error instanceof ApiClientError) {
            if (error.statusCode >= 400 && error.statusCode < 500) {
              return false;
            }
          }
          const status =
            (error as { statusCode?: number; status?: number })?.statusCode ??
            (error as { statusCode?: number; status?: number })?.status;
          if (typeof status === "number" && status >= 400 && status < 500) {
            return false;
          }
          // Only retry up to 1 time for network/transient 5xx errors
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new query client for request isolation
    return createQueryClient();
  } else {
    // Browser: create once and reuse singleton across renders
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient();
    }
    return browserQueryClient;
  }
}

export function clearQueryClient(): void {
  if (browserQueryClient) {
    // 1. Cancel in-flight queries to prevent post-logout cache repopulation
    browserQueryClient.cancelQueries();
    // 2. Clear all cached query data
    browserQueryClient.clear();
  }
}
