import { defineConfig, devices } from "@playwright/test";

const port = 3220;
const baseURL = `http://127.0.0.1:${port}`;

// Build without intake credentials, then verify runtime-only activation using
// a deliberately unusable local DB URL. Never inherit live provider credentials.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "lead-intake.spec.ts",
  outputDir: "test-results-lead-production",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: "node scripts/run-lead-browser-server.mjs",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
