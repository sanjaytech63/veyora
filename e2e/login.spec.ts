import { test, expect } from "@playwright/test";

test.describe("E2E — Customer Authentication & Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Unauthenticated" }),
      });
    });
  });

  test("toggles password visibility on show/hide icon click", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByPlaceholder("••••••••");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click show password toggle
    const toggleBtn = page.getByRole("button", { name: /show password/i });
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide
    const hideBtn = page.getByRole("button", { name: /hide password/i });
    await hideBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("displays error toast on invalid credentials", async ({ page }) => {
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password combination.",
        }),
      });
    });

    await page.goto("/login");

    await page.getByPlaceholder("name@example.com").fill("wrong@example.com");
    await page.getByPlaceholder("••••••••").fill("WrongPassword123!");

    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await submitBtn.click();

    await expect(page.getByText(/sign in failed/i)).toBeVisible();
    await expect(page.getByText(/invalid email or password combination/i)).toBeVisible();
  });

  test("successfully signs in customer and redirects to target destination", async ({ page }) => {
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: "usr_auth_771",
              email: "patron@veyora.com",
              firstName: "Radhika",
              lastName: "Mehta",
              role: "customer",
            },
            accessToken: "mock-jwt-customer-token",
          },
        }),
      });
    });

    await page.goto("/login?redirect=/shop");

    await page.getByPlaceholder("name@example.com").fill("patron@veyora.com");
    await page.getByPlaceholder("••••••••").fill("VeyoraSecure2026!");

    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await submitBtn.click();

    await expect(page).toHaveURL(/.*\/shop.*/);
  });
});
