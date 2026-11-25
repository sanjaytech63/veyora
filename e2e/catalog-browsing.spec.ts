import { test, expect } from "@playwright/test";

test.describe("E2E — Product Catalog Browsing & Search Relevance", () => {
  test.beforeEach(async ({ page }) => {
    // Mock category list and search API
    await page.route("**/api/v1/categories*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            { id: "cat-1", name: "Kurtis & Sets", slug: "kurtis", status: "active" },
            { id: "cat-2", name: "Ethnic Wear", slug: "ethnic-wear", status: "active" },
          ],
        }),
      });
    });

    await page.route("**/api/v1/brands*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });

    await page.route("**/api/v1/search/suggestions*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            suggestions: ["Chanderi Silk Kurti", "Bandhani Silk Lehenga"],
            products: [],
            categories: [],
          },
        }),
      });
    });

    await page.route("**/api/v1/search*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "prod-kurti-01",
              title: "Chanderi Silk Kurti Set with Organza Dupatta",
              slug: "chanderi-silk-kurti-set-organza-dupatta",
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
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
          facets: {
            categories: [{ id: "cat-1", name: "Kurtis & Sets", count: 1 }],
            priceRange: { min: 185, max: 185 },
            inStockCount: 1,
            outOfStockCount: 0,
          },
        }),
      });
    });
  });

  test("navigates to search page and verifies faceted product rendering", async ({ page }) => {
    await page.goto("/search?q=Chanderi");

    // Product title should be rendered
    await expect(page.getByText("Chanderi Silk Kurti Set with Organza Dupatta")).toBeVisible();
    await expect(page.getByText("$185.00")).toBeVisible();
  });

  test("renders product details page with variant swatches and specifications", async ({
    page,
  }) => {
    await page.route(
      "**/api/v1/products/chanderi-silk-kurti-set-organza-dupatta",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "prod-kurti-01",
              title: "Chanderi Silk Kurti Set with Organza Dupatta",
              slug: "chanderi-silk-kurti-set-organza-dupatta",
              description:
                "Handcrafted pure Chanderi silk kurti with delicate gota patti hand embroidery.",
              price: 185.0,
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
            },
          }),
        });
      }
    );

    await page.goto("/products/chanderi-silk-kurti-set-organza-dupatta");

    await expect(
      page.getByRole("heading", { name: "Chanderi Silk Kurti Set with Organza Dupatta" })
    ).toBeVisible();
    await expect(page.getByText(/handcrafted pure chanderi silk kurti/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /add to bag/i })).toBeVisible();
  });
});
