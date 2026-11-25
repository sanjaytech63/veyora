# Migration Guide: Task 19 — Metadata, SEO & Search Engine Optimization

## 1. Summary of Changes

This migration standardizes production-ready metadata, canonical URL handling, XML sitemaps, robots directives, and Schema.org structured data across `@veyora/web` and `@veyora/admin`.

---

## 2. File Level Changes

| File                                                    | Change Type | Purpose                                                                                                                     |
| ------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/config/site.ts`                           | Created     | Centralized site and SEO configuration with canonical URL builders and brand constants.                                     |
| `apps/web/src/app/layout.tsx`                           | Modified    | Configured `metadataBase`, brand title template `%s \| Veyora`, default title, and injected Organization / WebSite JSON-LD. |
| `apps/web/src/components/storefront/json-ld.tsx`        | Modified    | Added XSS-safe serialization (`\u003c`), Organization schema, and genuine data rating checks.                               |
| `apps/web/src/app/products/[slug]/page.tsx`             | Modified    | Updated `generateMetadata()` to use `siteConfig`, canonical URLs, and `noindex` on 404s.                                    |
| `apps/web/src/app/collections/page.tsx`                 | Modified    | Added canonical `/collections` metadata, OG cards, and breadcrumbs schema.                                                  |
| `apps/web/src/app/collections/[slug]/page.tsx`          | Modified    | Added dynamic lookbook metadata, collection canonicals, and CollectionPage JSON-LD.                                         |
| `apps/web/src/app/category/[slug]/page.tsx`             | Modified    | Standardized category metadata, canonical `/category/[slug]`, and CollectionPage JSON-LD.                                   |
| `apps/web/src/app/shop/page.tsx`                        | Modified    | Standardized canonical `/shop` to prevent duplicate query-parameter indexing.                                               |
| `apps/web/src/app/new-arrivals/page.tsx`                | Modified    | Converted to Server Component wrapper exporting metadata with canonical `/new-arrivals`.                                    |
| `apps/web/src/app/new-arrivals/new-arrivals-client.tsx` | Created     | Extracted client component for interactive filtering.                                                                       |
| `apps/web/src/app/search/page.tsx`                      | Modified    | Enforced `robots: { index: false, follow: false }` to prevent indexing internal search results.                             |
| `apps/web/src/app/robots.ts`                            | Modified    | Added disallow directives for `/account`, `/profile`, `/orders`, `/search`, `/wishlist`, etc.                               |
| `apps/web/src/app/sitemap.ts`                           | Modified    | Switched to server cache methods, added collections, removed search, and ensured graceful fallback.                         |
| `apps/web/src/app/*/layout.tsx` (11 private layouts)    | Created     | Established server-side `robots: { index: false, follow: false, nocache: true }` boundaries for all private routes.         |
| `apps/web/src/test/setup.ts`                            | Modified    | Added mock for `next/font/google` in test environment.                                                                      |
| `apps/web/src/test/seo-and-metadata.test.ts`            | Created     | 19 unit tests verifying all SEO rules, canonical generation, sitemaps, robots, and JSON-LD safety.                          |

---

## 3. Verification & Compliance Checklist

- [x] Brand name consistently set to **Veyora**.
- [x] Tagline consistently set to **"Shop smarter. Live better."**.
- [x] Root title template set to `%s | Veyora`.
- [x] Root layout `metadataBase` verified as absolute URL.
- [x] Canonical URLs strip query parameters to avoid duplicate content penalties.
- [x] Product schema conditionally renders `AggregateRating` only when real review counts and ratings exist.
- [x] JSON-LD serialization escapes `<` to `\u003c` preventing script breakout XSS attacks.
- [x] Admin console strictly excluded from search indexing (`disallow: ["/"]`).
- [x] Storefront `robots.txt` blocks private customer dashboards, cart, checkout, auth, and search.
- [x] XML sitemap includes static storefront routes, collections, categories, and products using server catalog methods.
- [x] XML sitemap strictly excludes internal search result pages.
- [x] 19 dedicated SEO tests passing in Vitest.
- [x] All 137 unit tests passing across `@veyora/web`.
- [x] All 46 unit tests passing across `@veyora/admin`.
- [x] Zero TypeScript errors across `@veyora/web` and `@veyora/admin`.
