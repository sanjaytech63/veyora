# 18 — Veyora Image & Font Optimization Migration Guide

## 1. Context & Scope

This guide details the architectural migrations and enhancements executed during **Task 18 — Image & Font Optimization** across `@veyora/web` and `@veyora/admin`.

The goal of this task is to maximize image loading performance, ensure responsive delivery, eliminate Cumulative Layout Shift (CLS), optimize Largest Contentful Paint (LCP), and deliver responsive typography without changing existing product records, backend schemas, or visual branding.

---

## 2. Changes Applied

### A. Next.js Image Configuration (`next.config.mjs`)

Both `apps/web/next.config.mjs` and `apps/admin/next.config.mjs` received the following enhancements:

- Enabled modern formats: `formats: ["image/avif", "image/webp"]`.
- Standardized device and image sizes to eliminate unnecessary intermediate image generation.
- Set `minimumCacheTTL: 86400` (24-hour edge caching for optimized images).
- Disabled dangerous SVG script execution (`dangerouslyAllowSVG: false`).
- Restricted `remotePatterns` to trusted origins: `res.cloudinary.com`, `images.unsplash.com`, `placehold.co`.

### B. Custom Image Components (`OptimizedImage` & `ProductImage`)

- **Lucide `Loader2` Integration**: Replaced raw skeleton pulse animations with an explicit, spinning Lucide `Loader2` overlay (`<Loader2 className="animate-spin" />`) equipped with `role="status"` and `aria-live="polite"` for screen reader accessibility.
- **Opacity Transitions**: Wrapped images with smooth fade-in animations (`opacity-0` transitioning to `opacity-100` once `onLoad` fires).
- **Error Fallbacks**: Displays a clean, non-intrusive Lucide `Package` placeholder icon when images fail to load or the source URL is invalid.
- **Layout Stability**: Enforced fixed aspect-ratio containers (`aspect-[4/5]` for apparel cards, `aspect-square` for avatar/thumbnails) to prevent Cumulative Layout Shift (CLS).

### C. Cloudinary Dynamic URL Rewriting

- Created `getOptimizedImageUrl` inside `src/components/ui/optimized-image.tsx` for both Web and Admin.
- Dynamically injects `f_auto,q_auto,w_<width>,c_limit` into Cloudinary URLs if transformations are not already specified.
- Preserves existing URLs and works client-side without altering database records or API payloads.

### D. Typography & Web Font Delivery

- **Web**: Enhanced Google Font `Poppins` in `apps/web/src/app/layout.tsx` with `adjustFontFallback: true`, `preload: true`, `display: "swap"`, and explicit system fallbacks (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`) to ensure zero-shift font swap.
- **Admin**: Configured `--font-sans` in `apps/admin/src/app/globals.css` with a high-performance system UI font stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), eliminating render-blocking typography overhead.

---

## 3. Files Modified and Created

| File                                                       | Status   | Description                                                                                      |
| :--------------------------------------------------------- | :------- | :----------------------------------------------------------------------------------------------- |
| `apps/web/next.config.mjs`                                 | Modified | Added AVIF/WebP, sizes, minimumCacheTTL, and remotePatterns.                                     |
| `apps/admin/next.config.mjs`                               | Modified | Added AVIF/WebP, sizes, minimumCacheTTL, and remotePatterns.                                     |
| `apps/web/src/components/ui/optimized-image.tsx`           | Modified | Added Lucide `Loader2` loader, `getOptimizedImageUrl`, smooth load fade, and `Package` fallback. |
| `apps/admin/src/components/ui/optimized-image.tsx`         | Modified | Added Lucide `Loader2` loader, `getOptimizedImageUrl`, smooth load fade, and `Package` fallback. |
| `apps/web/src/app/layout.tsx`                              | Modified | Configured `Poppins` with `adjustFontFallback: true` and system fallbacks.                       |
| `apps/admin/src/app/globals.css`                           | Modified | Streamlined `--font-sans` to native system UI font stack.                                        |
| `apps/web/src/test/image-and-font-optimization.test.tsx`   | Created  | 8 automated unit tests for web image optimization, transforms, and loader.                       |
| `apps/admin/src/test/image-and-font-optimization.test.tsx` | Created  | 6 automated unit tests for admin image optimization and loader.                                  |
| `docs/architecture/18-image-and-font-optimization.md`      | Created  | Core architecture document detailing image and font pipelines.                                   |
| `docs/migration/18-image-and-font-optimization.md`         | Created  | Migration and operational guide for Task 18.                                                     |

---

## 4. Verification & Testing

To run the automated tests for image and font optimization:

```bash
# Run Web image & font tests
npm run test --workspace=@veyora/web -- src/test/image-and-font-optimization.test.tsx --run

# Run Admin image & font tests
npm run test --workspace=@veyora/admin -- src/test/image-and-font-optimization.test.tsx --run

# Run TypeScript compilation checks
npm run typecheck --workspace=@veyora/web
npm run typecheck --workspace=@veyora/admin
```

All 14 tests pass and both workspaces compile with 0 TypeScript errors.
