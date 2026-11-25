import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env["PLAYWRIGHT_BASE_URL"] || "http://localhost:3300",
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
      url: "http://localhost:4010/api/v1/health",
      env: { PORT: "4010" },
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "node ../../node_modules/next/dist/bin/next dev -p 3300",
      cwd: "apps/web",
      url: "http://localhost:3300",
      env: {
        INTERNAL_API_URL: "http://localhost:4010/api/v1",
        NEXT_PUBLIC_API_URL: "http://localhost:4010/api/v1",
        NEXT_DIST_DIR: ".next-e2e",
      },
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "node ../../node_modules/next/dist/bin/next dev -p 3301",
      cwd: "apps/admin",
      url: "http://localhost:3301",
      env: {
        INTERNAL_API_URL: "http://localhost:4010/api/v1",
        NEXT_PUBLIC_API_URL: "http://localhost:4010/api/v1",
        NEXT_DIST_DIR: ".next-e2e",
      },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
