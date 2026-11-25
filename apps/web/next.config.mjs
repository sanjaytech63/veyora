/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@veyora/types", "@veyora/utils", "@veyora/validators", "@veyora/config"],
  async redirects() {
    return [
      {
        source: "/account",
        destination: "/profile",
        permanent: false,
      },
      {
        source: "/account/profile",
        destination: "/profile",
        permanent: false,
      },
    ];
  },
  // Next.js 16 Cache Components Configuration
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // Taxonomy: Category hierarchies and Brand catalogues (rarely mutated, long-lived)
    taxonomy: {
      stale: 3600, // 1 hour client cache
      revalidate: 86400, // 24 hours background revalidation
      expire: 604800, // 7 days expiration
    },
    // Lookbook: Curated collections and seasonal editorial lookbooks (medium frequency updates)
    lookbook: {
      stale: 1800, // 30 minutes client cache
      revalidate: 43200, // 12 hours background revalidation
      expire: 259200, // 3 days expiration
    },
    // Garment: Product details, specifications, and editorial descriptions (balanced freshness)
    garment: {
      stale: 300, // 5 minutes client cache
      revalidate: 3600, // 1 hour background revalidation
      expire: 86400, // 24 hours expiration
    },
    // Showcase: Homepage featured products, badges, and marketing highlights
    showcase: {
      stale: 600, // 10 minutes client cache
      revalidate: 7200, // 2 hours background revalidation
      expire: 86400, // 24 hours expiration
    },
  },
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
