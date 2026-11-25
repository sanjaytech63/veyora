import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";

/**
 * Strict allowlist of cache tag prefix families permitted for internal revalidation.
 * Prevents arbitrary or malicious tag purge requests from external callers.
 */
const ALLOWED_TAG_PREFIXES = [
  "catalog:products",
  "catalog:product:",
  "catalog:product-slug:",
  "catalog:categories",
  "catalog:category:",
  "catalog:category-slug:",
  "catalog:collections",
  "catalog:collection:",
  "catalog:collection-slug:",
  "catalog:brands",
] as const;

/**
 * Zod schema for internal revalidation payload
 */
const internalRevalidationSchema = z.object({
  event: z.string().min(1, "Event name is required").max(100),
  tags: z
    .array(z.string().min(1).max(200))
    .min(1, "At least one tag is required")
    .max(50, "Maximum 50 tags per revalidation batch"),
  profile: z.string().optional().default("max"),
  source: z.string().optional().default("worker"),
  timestamp: z.string().optional(),
});

function isTagAllowlisted(tag: string): boolean {
  return ALLOWED_TAG_PREFIXES.some((prefix) => tag === prefix || tag.startsWith(prefix));
}

function verifyInternalSecret(headerSecret: string | null | undefined): boolean {
  if (!headerSecret) return false;

  const configuredSecret =
    process.env.INTERNAL_CACHE_SECRET ||
    process.env.INTERNAL_REVALIDATION_SECRET ||
    "veyora_internal_revalidation_secret_dev";

  const secretBuffer = Buffer.from(configuredSecret, "utf-8");
  const headerBuffer = Buffer.from(headerSecret, "utf-8");

  if (secretBuffer.length !== headerBuffer.length) {
    return false;
  }

  return timingSafeEqual(secretBuffer, headerBuffer);
}

/**
 * Internal Cache Revalidation Route Handler
 * Endpoint: POST /api/internal/cache/revalidate
 */
export async function POST(req: NextRequest) {
  // 1. Enforce payload size limit (max 64KB)
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > 65536) {
    return NextResponse.json(
      { success: false, error: "Payload too large: maximum 64KB permitted" },
      { status: 413 }
    );
  }

  // 2. Secret authentication with constant-time comparison
  const authHeader =
    req.headers.get("x-internal-cache-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!verifyInternalSecret(authHeader)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: invalid or missing internal cache secret" },
      { status: 401 }
    );
  }

  // 3. Parse and validate JSON payload
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const parseResult = internalRevalidationSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation error: invalid revalidation payload structure",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { event, tags, profile, source } = parseResult.data;

  // 4. Validate all tags against allowlisted tag families
  const invalidTags = tags.filter((tag) => !isTagAllowlisted(tag));
  if (invalidTags.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden tag families rejected: ${invalidTags.join(", ")}`,
        allowedPrefixes: ALLOWED_TAG_PREFIXES,
      },
      { status: 400 }
    );
  }

  // 5. Execute tag revalidations
  const revalidated: string[] = [];
  try {
    for (const tag of tags) {
      revalidateTag(tag, profile);
      revalidated.push(tag);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown revalidation error";
    return NextResponse.json(
      {
        success: false,
        error: `Revalidation execution error: ${errorMsg}`,
        partialRevalidated: revalidated,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      event,
      source,
      revalidated,
      profile,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
