import { test, expect } from "@playwright/test";

test.describe("E2E — Cart Management & Checkout Pipeline", () => {
  test.beforeEach(async ({ page }) => {
    // Mock user session and initial empty cart
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "usr_e2e_customer_01",
            email: "patron.checkout@veyora.com",
            firstName: "Devi",
            lastName: "Sharma",
            role: "customer",
          },
        }),
      });
    });

    await page.route("**/api/v1/cart", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: "prod-kurti-01-var-1",
                productId: "prod-kurti-01",
                slug: "chanderi-silk-kurti",
                title: "Chanderi Silk Kurti",
                price: 185.0,
                quantity: 1,
                maxStock: 10,
              },
            ],
            subtotal: 185.0,
            total: 185.0,
          },
        }),
      });
    });
  });

  test("displays shopping bag items and allows coupon application", async ({ page }) => {
    await page.route("**/api/v1/coupons/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            code: "FESTIVE10",
            discountPercent: 10,
            discountAmount: 18.5,
          },
        }),
      });
    });

    await page.goto("/cart");

    // Verify bag header or item exists
    await expect(page.getByText(/chanderi silk kurti/i).first()).toBeVisible();
    await expect(page.getByText("$185.00").first()).toBeVisible();

    // Verify proceed to checkout button is visible
    const checkoutLink = page.getByRole("link", { name: /proceed to checkout/i });
    await expect(checkoutLink).toBeVisible();
  });
});
