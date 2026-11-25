import { test, expect } from "@playwright/test";

test.describe("E2E — Customer Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend auth check and registration API
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Unauthenticated" }),
      });
    });
  });

  test("validates required fields and password complexity rules", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

    const submitBtn = page.getByRole("button", { name: /create account/i });
    await submitBtn.click();

    // Verify validation errors are displayed
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/last name is required/i)).toBeVisible();
    await expect(page.getByText(/valid email address/i)).toBeVisible();
  });

  test("successfully submits valid registration and redirects to OTP verification", async ({
    page,
  }) => {
    // Mock registration endpoint
    await page.route("**/api/v1/auth/register", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: "usr_reg_123",
              email: "ananya.sharma@example.com",
              firstName: "Ananya",
              lastName: "Sharma",
              role: "customer",
            },
            otp: "123456",
          },
        }),
      });
    });

    await page.goto("/register");

    await page.locator('input[name="firstName"]').fill("Ananya");
    await page.locator('input[name="lastName"]').fill("Sharma");
    await page.locator('input[name="email"]').fill("ananya.sharma@example.com");
    await page.locator('input[name="password"]').fill("VeyoraSecure2026!");

    const submitBtn = page.getByRole("button", { name: /create account/i });
    await submitBtn.click();

    // Verify redirection to /verify-otp with query parameters
    await expect(page).toHaveURL(/.*verify-otp\?email=ananya\.sharma%40example\.com.*/);
  });
});
