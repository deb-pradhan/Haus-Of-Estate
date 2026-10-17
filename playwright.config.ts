import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests that need no external services: lead funnel + accessibility.
 * (The GA4/analytics specs keep their own configs: playwright.analytics*.config.ts.)
 *
 * Run against a running server:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3457 npx playwright test
 * or let Playwright start the production server (needs `npm run build` first):
 *   npx playwright test
 *
 * One-off browser download: `npx playwright install chromium`.
 */
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3210);
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: ["lead-funnel.spec.ts", "a11y.spec.ts"],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure", locale: "en-GB" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
