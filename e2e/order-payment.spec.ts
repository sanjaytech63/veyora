import { test, expect } from "@playwright/test";

test.describe("E2E — Order Placement & Payment Verification Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Mock customer authenticated profile
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "usr_order_99",
            email: "ananya.order@veyora.com",
            firstName: "Ananya",
            lastName: "Patel",
            role: "customer",
          },
        }),
      });
    });

    // Mock customer shipping addresses
    await page.route("**/api/v1/addresses", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "addr_1",
              fullName: "Ananya Patel",
              street: "Flat 402, Royal Palms, C-Scheme",
              city: "Jaipur",
              state: "Rajasthan",
              postalCode: "302001",
              country: "IN",
              phone: "+919876543210",
              isDefault: true,
            },
          ],
        }),
      });
    });

    // Mock cart checkout validation
    await page.route("**/api/v1/checkout/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            isValid: true,
            totals: {
              subtotal: 185.0,
              discount: 0,
              shipping: 0,
              tax: 0,
              total: 185.0,
            },
          },
        }),
      });
    });
  });

  test("loads checkout page with shipping address and order summary", async ({ page }) => {
    await page.goto("/checkout");

    // Verify order review section loads
    await expect(page.getByText(/checkout/i).first()).toBeVisible();
    await expect(page.getByText(/delivery address/i).first()).toBeVisible();
    await expect(page.getByText(/royal palms/i).first()).toBeVisible();
  });
});
