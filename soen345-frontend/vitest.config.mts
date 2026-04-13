import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    reporters: ["verbose", ["junit", { outputFile: "test-results/junit.xml" }]],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["app/**/*.{ts,tsx}", "lib/**/*.ts"],
      exclude: [
        "**/*.d.ts",
        "**/*.config.*",
        "**/e2e/**",
        "**/__tests__/**",
        "**/app/**/layout.tsx",
        "**/lib/types.ts",
        "**/payment-info-modal.tsx",
        "**/organizer-login-form.tsx",
        "**/event-details-modal.tsx",
        "**/dashboard-client.tsx",
        "**/organizer-dashboard-client.tsx",
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
});
