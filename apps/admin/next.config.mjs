/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@veyora/types", "@veyora/utils", "@veyora/validators", "@veyora/config"],
};

export default nextConfig;
