/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@veyora/types", "@veyora/utils", "@veyora/validators", "@veyora/config"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
};

export default nextConfig;
