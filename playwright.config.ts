import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env["PLAYWRIGHT_BASE_URL"] || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-api-server.cjs",
      url: "http://localhost:4000/api/v1/health",
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: "npm run dev --workspace=@veyora/web",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env["CI"],
      timeout: 120000,
    },
    {
      command: "npm run dev --workspace=@veyora/admin",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env["CI"],
      timeout: 120000,
    },
  ],
});
