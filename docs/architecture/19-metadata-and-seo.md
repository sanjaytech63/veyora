# Veyora Metadata, SEO & Search Engine Optimization Architecture

## 1. Overview & Core Philosophy

Search Engine Optimization (SEO) in Veyora provides search visibility, rich snippets, and social sharing without degrading performance, leaking private customer data, or compromising the Next.js 16 App Router architecture.

The architecture enforces strict separation between:

1. **Public Storefront (`@veyora/web`)**: Fully discoverable, structured for organic search ranking, equipped with dynamic metadata, canonical URL tags, OpenGraph / Twitter cards, XML sitemaps, and Schema.org JSON-LD structured data.
2. **Private Administrative Console (`@veyora/admin`)**: Strictly excluded from search indexing via HTTP headers, meta tags, and `robots.txt` (`disallow: ["/"]`).

---

## 2. Centralized Site Configuration (`site.ts`)

To eliminate hardcoded strings and ensure brand consistency across layouts, components, and sitemaps, configuration is centralized in `apps/web/src/config/site.ts`:

- **Brand Name**: `Veyora`
- **Brand Tagline**: `Shop smarter. Live better.`
- **Default Title**: `Veyora — Shop smarter. Live better.`
- **Title Template**: `%s | Veyora`
- **Metadata Base**: Validated absolute URL resolved from `NEXT_PUBLIC_SITE_URL` (fallback `https://veyora.store`).
- **Canonical Helper**: `getCanonicalUrl(path)` automatically strips transient query parameters (e.g. `?page=2`, `?sort=price_asc`, `?filter=...`) and hash fragments, normalizing paths to prevent duplicate content penalties.

---

## 3. Metadata Hierarchy & Inheritance

```
RootLayout (`apps/web/src/app/layout.tsx`)
├── metadataBase: new URL(siteConfig.url)
├── title: { default: "Veyora — Shop smarter. Live better.", template: "%s | Veyora" }
├── description: siteConfig.description
├── openGraph / twitter: siteConfig.defaultTitle, absolute og-image.jpg
│
├── Public Routes (Inherit template, provide page-specific title & canonical)
│   ├── /products/[slug] -> generateMetadata() with real product data & OpenGraph image
│   ├── /collections/[slug] -> generateMetadata() with collection lookbook details
│   ├── /category/[slug] -> generateMetadata() with category department data
│   ├── /shop -> static canonical /shop, stripping filter query params
│   └── /new-arrivals -> static canonical /new-arrivals
│
└── Private Routes (Enforce noindex, nofollow)
    ├── /account/layout.tsx -> robots: { index: false, follow: false, nocache: true }
    ├── /profile/layout.tsx -> robots: { index: false, follow: false, nocache: true }
    ├── /orders/layout.tsx -> robots: { index: false, follow: false, nocache: true }
    ├── /cart/layout.tsx -> robots: { index: false, follow: false, nocache: true }
    ├── /checkout/layout.tsx -> robots: { index: false, follow: false, nocache: true }
    ├── /wishlist/layout.tsx -> robots: { index: false, follow: false, nocache: true }
    ├── /login/layout.tsx -> robots: { index: false, follow: false, nocache: true }
    ├── /register/layout.tsx -> robots: { index: false, follow: false, nocache: true }
    └── /search/page.tsx -> robots: { index: false, follow: false, nocache: true }
```

---

## 4. Canonical URL Strategy

Duplicate content is a major issue in e-commerce due to facet filters, pagination, and sorting parameters:

- Product listings: `/shop?category=dresses&sort=price_desc&page=2`
- Search queries: `/search?q=chanderi+silk`

### Implementation

- The canonical URL helper `getCanonicalUrl(path)` strips all query params and normalizes slashes.
- Catalog routes define self-referencing canonical URLs pointing to their base resource path.
- Search result pages are marked `noindex, nofollow` and disallowed in `robots.txt`, preventing search engine index bloating.

---

## 5. Robots & XML Sitemap Directives

### `robots.txt`

- **Web (`apps/web/src/app/robots.ts`)**:
  - `allow: ["/"]`
  - `disallow`: `/admin`, `/checkout`, `/cart`, `/account`, `/profile`, `/orders`, `/search`, `/wishlist`, `/login`, `/register`, `/api`
  - Points to `sitemap: https://veyora.store/sitemap.xml`
- **Admin (`apps/admin/src/app/robots.ts`)**:
  - `rules: [{ userAgent: "*", disallow: ["/"] }]`
  - Completely excludes all administrative entry points from search indexing.

### `sitemap.ts` (`apps/web/src/app/sitemap.ts`)

- Utilizes server-side catalog caching methods (`getCachedProducts`, `getCachedCategories`, `getCachedCollections`).
- Publishes indexable storefront routes:
  - Homepage (`priority: 1.0`, `daily`)
  - Shop (`priority: 0.9`, `daily`)
  - Collections index & dynamic collection pages (`priority: 0.8`, `weekly`)
  - Categories (`priority: 0.7`, `weekly`)
  - Products (`priority: 0.8`, `daily`)
- Gracefully returns static routes if the database or cache is temporarily offline during build.
- Strictly excludes search result pages, cart, checkout, and private customer dashboards.

---

## 6. Structured Data (Schema.org JSON-LD)

To prevent Cross-Site Scripting (XSS) via script breakout when user or administrative data is injected into HTML `<script type="application/ld+json">`, all JSON-LD schemas pass through `safeJsonLdReplacer()`:

```typescript
export function safeJsonLdReplacer(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
```

### Supported Schemas

1. **Organization**: Renders brand identity, corporate name "Veyora", slogan "Shop smarter. Live better.", logo URL, and verified social links.
2. **WebSite**: Renders Sitelinks Searchbox action (`SearchAction`) enabling Google search bar integration.
3. **Product**: Renders real catalog product details, SKU, currency (`USD`), availability (`InStock` / `OutOfStock`), and conditionally renders `AggregateRating` only when genuine review counts and ratings exist.
4. **BreadcrumbList**: Emits hierarchical navigation schema on product, category, and collection pages.
5. **CollectionPage**: Renders item list schema for seasonal lookbooks and category departments.
