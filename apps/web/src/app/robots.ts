import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/*",
          "/checkout",
          "/checkout/*",
          "/cart",
          "/cart/*",
          "/account",
          "/account/*",
          "/profile",
          "/profile/*",
          "/orders",
          "/orders/*",
          "/search",
          "/search/*",
          "/wishlist",
          "/wishlist/*",
          "/api",
          "/api/*",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-otp",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
