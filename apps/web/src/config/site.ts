/**
 * Centralized Site and SEO Configuration for Veyora Storefront
 *
 * Provides single-source-of-truth brand definitions, canonical URL builders,
 * and standard OpenGraph / Twitter metadata constants.
 */

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://veyora.store";

// Normalize site URL: ensure valid protocol and strip any trailing slash
export const siteUrl = rawSiteUrl.replace(/\/+$/, "");

export const siteConfig = {
  name: "Veyora",
  brandName: "Veyora",
  tagline: "Shop smarter. Live better.",
  defaultTitle: "Veyora — Shop smarter. Live better.",
  titleTemplate: "%s | Veyora",
  description:
    "Discover modern fashion and curated lifestyle apparel on Veyora. Shop smarter, live better with effortless designs crafted for timeless elegance.",
  url: siteUrl,
  ogImage: `${siteUrl}/og-image.jpg`,
  links: {
    twitter: "https://twitter.com/veyora",
    instagram: "https://instagram.com/veyora",
    github: "https://github.com/veyora",
  },
  keywords: [
    "Veyora",
    "clothing",
    "fashion",
    "e-commerce",
    "curated apparel",
    "sustainable fashion",
    "contemporary style",
    "designer collections",
    "shop smarter live better",
  ],
  author: {
    name: "Veyora",
    url: siteUrl,
  },
  creator: "Veyora",
  publisher: "Veyora",
} as const;

/**
 * Generates an absolute or normalized canonical URL for any route path.
 *
 * Rules:
 * - Strips query parameters (e.g. ?page=2, ?sort=price_asc) and hash fragments to prevent duplicate content.
 * - Trims trailing slashes for consistency (except root /).
 * - Ensures a single leading slash.
 */
export function getCanonicalUrl(path: string = "/"): string {
  if (!path) return siteUrl;

  // If already absolute URL, parse and normalize path
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const parsed = new URL(path);
      const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
      return `${siteUrl}${pathname}`;
    } catch {
      return siteUrl;
    }
  }

  // Strip query and hash
  const withoutQuery = path.split("?")[0] ?? "";
  const clean = (withoutQuery.split("#")[0] ?? "").trim();
  const normalized = clean.startsWith("/") ? clean : `/${clean}`;
  const trimmed = normalized === "/" ? "" : normalized.replace(/\/+$/, "");

  return `${siteUrl}${trimmed}`;
}

/**
 * Strips transient filter, sort, and pagination query params from URLs
 * to ensure search engines index only canonical catalog URLs.
 */
export function normalizeCanonicalPath(path: string): string {
  const withoutQuery = path.split("?")[0] ?? "";
  const clean = (withoutQuery.split("#")[0] ?? "").trim();
  if (!clean || clean === "/") return "/";
  return clean.replace(/\/+$/, "");
}
