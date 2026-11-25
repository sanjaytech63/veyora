/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  agentRules: false,
  transpilePackages: ["@veyora/types", "@veyora/utils", "@veyora/validators", "@veyora/config"],
  // NOTE [Task 13 - Cache Architecture Policy]:
  // Next.js Cache Components are intentionally NOT enabled in @veyora/admin (cacheComponents: false).
  // The Admin application is an authenticated multi-operator back-office environment where:
  // 1. All routes require request-time authorization and dynamic session headers.
  // 2. Shared server-side caching presents security risks of cross-operator tenant/dossier leakage.
  // 3. Inventory stock adjustments, orders, shipments, customer dossiers, staff roles, and audit logs
  //    require strictly dynamic, real-time consistency with the MongoDB/Redis backend.
  // 4. Client-side caching and invalidations are exclusively managed via TanStack Query and WebSockets.
  cacheComponents: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
