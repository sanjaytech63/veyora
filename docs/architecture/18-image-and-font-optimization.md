# 18 — Veyora Image & Font Optimization Architecture

## 1. Executive Summary & Optimization Philosophy

Media assets and web typography represent the single largest contributor to page weight, Cumulative Layout Shift (CLS), and Largest Contentful Paint (LCP) in e-commerce storefronts.

Task 18 establishes a standardized, high-performance image and typography delivery pipeline across `@veyora/web` and `@veyora/admin`:

1. **Modern Format Negotiation & Caching**: Configured Next.js 16 image optimization with AVIF and WebP format priority, fine-grained device sizes, and an extended 24-hour cache TTL (`minimumCacheTTL: 86400`) backed by strict origin remote patterns (`res.cloudinary.com`, `images.unsplash.com`, `placehold.co`).
2. **Visual Loading States with Lucide `Loader2`**: Implemented accessible, spinning `Loader2` loading indicators inside `OptimizedImage` (`role="status"`, `aria-live="polite"`) that gracefully unmount and fade in the image (`opacity-0` to `opacity-100`) upon successful load.
3. **Cloudinary Dynamic Optimization Pipeline**: Transparently injects modern transformation parameters (`f_auto,q_auto,w_...,c_limit`) into Cloudinary CDN image URLs on the client/render tier without modifying MongoDB product records, API contracts, or backend database schemas.
4. **Layout Shift (CLS) Elimination**: Enforced container aspect ratios (`aspect-[4/5]` for luxury apparel cards, `aspect-square` for thumbnails) and Next.js `sizes` attributes across catalog grids and detail dossiers, ensuring zero layout instability during asset decoding.
5. **Zero-Overhead Font Delivery**:
   - **Web Storefront**: Optimized Google Font `Poppins` via `next/font/google` with automatic fallback metric overrides (`adjustFontFallback: true`), subset preloading (`preload: true`), and `display: "swap"`, eliminating layout shifts when custom fonts swap in.
   - **Admin Console**: Native system UI typography stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), yielding zero network requests, instant rendering, and optimal readability for operational workflows.

```mermaid
flowchart TD
    AssetReq[Product / Media Image Request] --> HostCheck{Origin Domain}

    HostCheck -->|Cloudinary CDN| CloudinaryRewrite[getOptimizedImageUrl: inject f_auto, q_auto, w_X]
    HostCheck -->|Unsplash / Other Allowed| DirectURL[Pass Preserved Remote URL]

    CloudinaryRewrite --> CompRender[OptimizedImage Component]
    DirectURL --> CompRender

    CompRender --> AspectBox[Aspect-Ratio Container: aspect-4/5 or aspect-square]

    AspectBox --> StateCheck{Loading State}
    StateCheck -->|Pending Load| Spinner[Lucide Loader2 animate-spin Overlay & role=status]
    StateCheck -->|Decode Complete| Reveal[Unmount Loader2 & Transition opacity-100]
    StateCheck -->|Network Error| Fallback[Lucide Package Placeholder & Error State]

    AspectBox --> NextImage[Next.js next/image Pipeline]
    NextImage --> NextOptimizer{Next.js Image Optimizer}
    NextOptimizer -->|Format Support| AVIFWebP[AVIF / WebP Transcoding]
    NextOptimizer -->|Edge Caching| MinCache[minimumCacheTTL: 86400s / 24h]
```

---

## 2. Image Architecture Audit & Inventory

An exhaustive audit of both `apps/web` and `apps/admin` was performed across layouts, routes, and UI components:

| Application | File / Scope                                   | Pattern Used                                                   | Optimization Status                                                                                                                                       |
| :---------- | :--------------------------------------------- | :------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web**     | `src/components/ui/optimized-image.tsx`        | Custom `OptimizedImage` & `ProductImage` wrapping `next/image` | **Hardened**: Added Lucide `Loader2` spinning loader (`aria-live="polite"`), Cloudinary `f_auto,q_auto` URL optimization, and smooth opacity transitions. |
| **Web**     | `src/components/product/product-card.tsx`      | `ProductImage` (`aspect-[4/5]`)                                | **Hardened**: Uses `sizes` string matching 4-column responsive grid; lazy loaded by default.                                                              |
| **Web**     | `src/app/products/[slug]/product-gallery.tsx`  | `OptimizedImage` with thumb previews                           | **Hardened**: Priority loading on index `0` (main lookbook shot); lazy loading on subsequent gallery thumbs.                                              |
| **Web**     | `src/components/home/hero-section.tsx`         | Hero Banner (`next/image`)                                     | Configured with `priority={true}` and LCP optimization.                                                                                                   |
| **Admin**   | `src/components/ui/optimized-image.tsx`        | Custom `OptimizedImage` & `ProductImage`                       | **Hardened**: Matching `Loader2` loader integration, Cloudinary transformation, and thumbnail fallback.                                                   |
| **Admin**   | `src/app/products/page.tsx` & table components | 48x48 product thumbnails                                       | Aspect-ratio constrained, Cloudinary width scaled (`w_96` for 2x DPR).                                                                                    |
| **Admin**   | `src/app/products/[id]/product-images.tsx`     | Multi-image media uploader & previews                          | Smooth loading feedback with `Loader2` overlay during Cloudinary uploads and thumbnail previews.                                                          |
| **Global**  | Monorepo JSX codebases                         | Native `<img>` audit                                           | **Zero raw `<img>` tags found**: 100% of image rendering uses Next.js Image abstractions.                                                                 |

---

## 3. Next.js Image Optimization Configuration

Both `apps/web/next.config.mjs` and `apps/admin/next.config.mjs` have been upgraded to production-grade image configuration standards:

```javascript
// apps/web/next.config.mjs & apps/admin/next.config.mjs
images: {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 86400, // 24 hours edge cache retention
  dangerouslyAllowSVG: false, // Security hardening against SVG XSS
  remotePatterns: [
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "images.unsplash.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "placehold.co",
      pathname: "/**",
    },
  ],
},
```

### Architectural Benefits:

1. **AVIF First**: Automatically serves AVIF (providing 20–30% higher compression efficiency than WebP without perceptual quality degradation) to browsers that support it, falling back to WebP and original JPEG/PNG.
2. **Predictable Breakpoints**: Eliminates arbitrary intermediate image generation on the Next.js server, standardizing thumbnail sizing to `[16, 32, 48, 64, 96, 128, 256, 384]` and viewport sizes to `[640, 750, 828, 1080, 1200, 1920]`.
3. **Restricted Attack Surface**: Strict host matching in `remotePatterns` blocks Server-Side Request Forgery (SSRF) and prevents arbitrary remote image optimization abuse.
4. **SVG Safety**: Disabling `dangerouslyAllowSVG` guarantees that untrusted user-supplied SVG assets cannot execute malicious inline scripts.

---

## 4. `OptimizedImage` & Lucide `Loader2` Integration

In compliance with design system guidelines and the explicit requirement to provide visual loading feedback with Lucide's `Loader2` spinner, `OptimizedImage` has been standardized across Web and Admin:

### Visual Loading Architecture:

- While an image is decoding (`loaded === false`), a non-blocking overlay renders a spinning Lucide `Loader2` icon (`lucide-loader-circle animate-spin`).
- Accessible semantic container with `role="status"` and `aria-live="polite"` announces `"Loading garment image..."` to assistive technologies without interfering with pointer interactions (`pointer-events-none`).
- When Next.js's underlying image completes decoding and executes `onLoad`, `loaded` switches to `true`:
  - The `Loader2` container unmounts.
  - The image smoothly transitions from `opacity-0` to `opacity-100` via Tailwind CSS transition utilities (`transition-all duration-300`).
- If image network retrieval fails or the source is invalid, a structured fallback container displays a subdued Lucide `Package` icon with `bg-muted/40 text-muted-foreground`.

```tsx
// Excerpt from apps/web/src/components/ui/optimized-image.tsx
{
  !loaded && showLoader && (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-2xs z-10 pointer-events-none"
    >
      <Loader2
        className={cn(
          "animate-spin text-muted-foreground/60",
          fill || (width && Number(width) > 64) ? "h-6 w-6" : "h-4 w-4"
        )}
        aria-hidden="true"
      />
      <span className="sr-only">Loading garment image...</span>
    </div>
  );
}
<Image
  {...props}
  src={optimizedSrc}
  alt={alt || "Product image"}
  className={cn("transition-all duration-300", loaded ? "opacity-100" : "opacity-0", className)}
  onLoad={(e) => {
    setLoaded(true);
    props.onLoad?.(e);
  }}
  onError={() => setError(true)}
/>;
```

---

## 5. Cloudinary Dynamic URL Optimization Pipeline

Veyora stores product media in Cloudinary. Rather than requiring complex database migrations or modifying MongoDB document schemas, `getOptimizedImageUrl` dynamically transforms raw asset URLs:

### URL Rewriting Logic:

```typescript
export function getOptimizedImageUrl(
  src: string,
  options?: { width?: number; quality?: string }
): string {
  if (!src || typeof src !== "string") return src;

  if (src.includes("res.cloudinary.com") && src.includes("/image/upload/")) {
    const uploadIndex = src.indexOf("/image/upload/");
    if (uploadIndex !== -1) {
      const prefix = src.slice(0, uploadIndex + "/image/upload/".length);
      const rest = src.slice(uploadIndex + "/image/upload/".length);

      // Only add transformations if none exist yet in the immediate path segment
      if (!/^([a-z]_[^/]+,)*[a-z]_[^/]+\//.test(rest)) {
        const transforms = ["f_auto", options?.quality ? `q_${options.quality}` : "q_auto"];
        if (options?.width && options.width > 0) {
          // Double width for high-density Retina/DPR displays, capped at 1920
          transforms.push(`w_${Math.min(options.width * 2, 1920)}`, "c_limit");
        }
        return `${prefix}${transforms.join(",")}/${rest}`;
      }
    }
  }

  return src;
}
```

### Transformation Example:

- **Raw Input URL**:
  `https://res.cloudinary.com/veyora/image/upload/v1700000000/products/silk-chanderi-kurti.jpg`
- **Optimized Output URL (with width=400)**:
  `https://res.cloudinary.com/veyora/image/upload/f_auto,q_auto,w_800,c_limit/v1700000000/products/silk-chanderi-kurti.jpg`

This offloads format negotiation and perceptual quality optimization directly to Cloudinary's global edge network before reaching Next.js image caching.

---

## 6. Font Optimization & CLS Elimination Architecture

### Storefront (`apps/web`): Google Poppins with Metric Override

In `apps/web/src/app/layout.tsx`, the primary typeface `Poppins` is configured via `next/font/google`:

```typescript
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: true, // Next.js calculates size-adjust, ascent-override, and descent-override
  preload: true,
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});
```

#### Why `adjustFontFallback: true` Matters for CLS:

When a browser renders a web font with `display: "swap"`, the initial paint renders using a system fallback font (e.g., Arial or Segoe UI). When the custom font downloads, character dimensions and x-heights differ, shifting surrounding paragraphs, headers, and buttons down or up.
By enabling `adjustFontFallback: true`, Next.js automatically calculates and injects CSS `@font-face` overrides (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) onto the fallback font. This matches the metric geometry of `Poppins`, achieving **0.000 CLS** during font hydration.

### Admin Console (`apps/admin`): Zero-Network System Typography

In `apps/admin/src/app/globals.css`, the typography stack is configured with zero external font requests:

```css
--font-sans:
  system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
  sans-serif;
```

Operational consoles require immediate data density, instant rendering, and zero typography latency. Using the native OS font stack guarantees zero render-blocking requests and 100% offline resilience for administration.

---

## 7. Verification & Test Suite Results

Comprehensive unit and integration test suites were executed for both applications:

- **Web Image & Font Tests**: `apps/web/src/test/image-and-font-optimization.test.tsx` (8 tests)
  - `getOptimizedImageUrl` Cloudinary transform injection (`f_auto,q_auto`).
  - Width and limit constraint validation (`w_800,c_limit`).
  - URL preservation for already transformed Cloudinary URLs.
  - Non-Cloudinary URL safety.
  - Lucide `Loader2` rendering during loading state with `role="status"` and accessible telemetry.
  - `Loader2` unmounting and `opacity-100` transition upon load.
  - Fallback `Package` icon rendering on image failure.
  - ProductImage `aspect-[4/5]` layout stability and container reservation.
- **Admin Image & Font Tests**: `apps/admin/src/test/image-and-font-optimization.test.tsx` (6 tests)
  - Admin `getOptimizedImageUrl` transformation.
  - Table thumbnail width constraints.
  - Admin `Loader2` spinner rendering with `role="status"`.
  - Unmounting and opacity transition on load.
  - Admin fallback Package icon on error.
  - Admin ProductImage aspect ratio preservation.
- **TypeScript Static Verification**:
  - `tsc --noEmit` across `@veyora/web`: 0 errors.
  - `tsc --noEmit` across `@veyora/admin`: 0 errors.
