import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veyora.store";

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
          "/orders",
          "/orders/*",
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
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
