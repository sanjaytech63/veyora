import { logger } from "@veyora/utils";

export interface RevalidateStorefrontCacheOptions {
  event: string;
  tags: string[];
  profile?: string;
  storefrontUrl?: string;
  secret?: string;
  maxRetries?: number;
}

/**
 * Worker-to-Storefront Authenticated Cache Invalidator
 * Invoked by BullMQ processors when background mutations complete (e.g. inventory adjustments, order completion).
 * Communicates via HTTP with Next.js Route Handler /api/internal/cache/revalidate.
 */
export async function triggerStorefrontRevalidation(
  options: RevalidateStorefrontCacheOptions
): Promise<{ success: boolean; revalidated?: string[]; error?: string }> {
  const {
    event,
    tags,
    profile = "max",
    storefrontUrl = process.env.STOREFRONT_INTERNAL_URL ||
      process.env.STOREFRONT_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000",
    secret = process.env.INTERNAL_CACHE_SECRET ||
      process.env.INTERNAL_REVALIDATION_SECRET ||
      "veyora_internal_revalidation_secret_dev",
    maxRetries = 3,
  } = options;

  const endpoint = `${storefrontUrl.replace(/\/+$/, "")}/api/internal/cache/revalidate`;
  const payload = {
    event,
    tags,
    profile,
    source: "bullmq-worker",
    timestamp: new Date().toISOString(),
  };

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-cache-secret": secret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Storefront cache revalidation failed with HTTP ${response.status}: ${errorText}`
        );
      }

      const result = (await response.json()) as { success: boolean; revalidated: string[] };
      logger.info(
        "CACHE_INVALIDATION",
        `Successfully revalidated storefront tags [${tags.join(", ")}] for event '${event}'`
      );

      return {
        success: true,
        revalidated: result.revalidated,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(
        "CACHE_INVALIDATION",
        `Revalidation attempt ${attempt}/${maxRetries} failed for event '${event}': ${lastError.message}`
      );

      if (attempt < maxRetries) {
        // Exponential backoff: 200ms, 400ms...
        await new Promise((resolve) => setTimeout(resolve, attempt * 200));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "All revalidation retry attempts failed",
  };
}
