/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");

const PORT = process.env.PORT || 4000;

const sampleProducts = [
  {
    id: "prod-kurti-01",
    title: "Chanderi Silk Kurti Set with Organza Dupatta",
    slug: "chanderi-silk-kurti-set-organza-dupatta",
    description: "Handcrafted pure Chanderi silk kurti with delicate gota patti hand embroidery.",
    price: 185.0,
    compareAtPrice: 240.0,
    stock: 24,
    status: "active",
    images: [
      {
        url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000",
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: "var-1",
        color: "Crimson Red",
        size: "S",
        price: 185.0,
        stock: 12,
        sku: "VYR-KRT-01",
      },
    ],
    category: {
      id: "cat-1",
      name: "Kurtis & Sets",
      slug: "kurtis",
    },
  },
  {
    id: "prod-admin-01",
    title: "Handloom Chanderi Anarkali Suit",
    slug: "handloom-chanderi-anarkali-suit",
    sku: "VYR-ANR-001",
    price: 240.0,
    stock: 18,
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-admin-02",
    title: "Bandhani Silk Embroidered Dupatta",
    slug: "bandhani-silk-embroidered-dupatta",
    sku: "VYR-BND-002",
    price: 75.0,
    stock: 3,
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

const sampleCategories = [
  { id: "cat-1", name: "Kurtis & Sets", slug: "kurtis", status: "active" },
  { id: "cat-2", name: "Ethnic Wear", slug: "ethnic-wear", status: "active" },
];

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url || "/", `http://${host}`);
  const pathname = url.pathname;

  res.setHeader("Content-Type", "application/json");

  // Health probe
  if (pathname === "/api/v1/health" || pathname === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Single product detail by slug / id
  if (pathname.startsWith("/api/v1/products/") && pathname !== "/api/v1/products/") {
    const slug = decodeURIComponent(pathname.replace("/api/v1/products/", ""));
    const found = sampleProducts.find((p) => p.slug === slug || p.id === slug) || sampleProducts[0];
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: found }));
    return;
  }

  // Product listing
  if (pathname === "/api/v1/products") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        success: true,
        data: sampleProducts,
        meta: {
          total: sampleProducts.length,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    );
    return;
  }

  // Categories
  if (pathname.startsWith("/api/v1/categories")) {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: sampleCategories }));
    return;
  }

  // Collections
  if (pathname.startsWith("/api/v1/collections")) {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: [] }));
    return;
  }

  // Brands
  if (pathname.startsWith("/api/v1/brands")) {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: [] }));
    return;
  }

  // Admin catalog stats
  if (
    pathname.startsWith("/api/v1/admin/catalog/stats") ||
    pathname.startsWith("/api/v1/admin/products/stats")
  ) {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        success: true,
        data: {
          totalProducts: 42,
          activeProducts: 38,
          draftProducts: 4,
          outOfStockCount: 0,
          lowStockCount: 2,
        },
      })
    );
    return;
  }

  // Fallback for unhandled mock calls
  res.writeHead(200);
  res.end(JSON.stringify({ success: true, data: null }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[E2E Mock Server] Listening on http://localhost:${PORT}`);
});
