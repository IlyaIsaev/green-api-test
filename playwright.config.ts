import { defineConfig, devices } from "@playwright/test";

const e2eOrigin = "http://127.0.0.1:5174";

export default defineConfig({
  testDir: "./src/pages",
  testMatch: "**/tests/**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: e2eOrigin,
    trace: "on-first-retry",
  },
  webServer: {
    command: "vp dev --host 127.0.0.1 --port 5174 --strictPort",
    url: e2eOrigin,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
