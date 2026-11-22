import { test, expect } from "@playwright/test";

test.describe("E2E — Admin Product Management & Catalog Governance", () => {
  const ADMIN_BASE = "http://localhost:3001";

  test.beforeEach(async ({ page }) => {
    // Mock admin auth session
    await page.route("**/api/v1/admin/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "adm_ops_01",
            email: "ops.admin@veyora.com",
            firstName: "Super",
            lastName: "Admin",
            role: "superadmin",
          },
        }),
      });
    });

    // Mock admin products endpoint
    await page.route("**/api/v1/admin/products*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "prod-admin-01",
              title: "Handloom Chanderi Anarkali Suit",
              sku: "VYR-ANR-001",
              price: 240.0,
              stock: 18,
              status: "active",
              createdAt: new Date().toISOString(),
            },
            {
              id: "prod-admin-02",
              title: "Bandhani Silk Embroidered Dupatta",
              sku: "VYR-BND-002",
              price: 75.0,
              stock: 3,
              status: "active",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Mock catalog stats
    await page.route("**/api/v1/admin/products/stats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            totalProducts: 42,
            activeProducts: 38,
            draftProducts: 4,
            outOfStockCount: 0,
            lowStockCount: 2,
          },
        }),
      });
    });
  });

  test("loads admin products page with data table and inventory status", async ({ page }) => {
    await page.goto(`${ADMIN_BASE}/products`);

    // Verify products table headings and product rows
    await expect(page.getByText("Handloom Chanderi Anarkali Suit")).toBeVisible();
    await expect(page.getByText("VYR-ANR-001")).toBeVisible();
    await expect(page.getByText("Bandhani Silk Embroidered Dupatta")).toBeVisible();
  });
});
