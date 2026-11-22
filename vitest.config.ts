import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "apps/admin/vitest.config.ts",
      "apps/api/vitest.config.ts",
      "apps/web/vitest.config.ts",
      "packages/utils/vitest.config.ts",
      "packages/validators/vitest.config.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/.next/**",
        "**/*.config.*",
        "**/e2e/**",
        "**/apps/api/src/database/seed.ts",
        "**/*.d.ts",
        "**/*.d.mts",
      ],
    },
  },
});
