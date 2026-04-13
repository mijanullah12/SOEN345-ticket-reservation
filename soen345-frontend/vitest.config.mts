import { platform } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** v8 coverage on Windows can race when many workers write under coverage/.tmp (ENOENT). */
const coverageCli =
  process.argv.includes("--coverage") ||
  process.argv.some((a) => a.startsWith("--coverage="));
const coverageWorkerFix =
  platform() === "win32" && coverageCli
    ? { maxWorkers: 1, fileParallelism: false }
    : {};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    ...coverageWorkerFix,
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    reporters: ["verbose", ["junit", { outputFile: "test-results/junit.xml" }]],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "text-summary", "html", "lcov"],
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
