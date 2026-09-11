import { defineConfig, devices } from "@playwright/test";

const port = 3116;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next dev -H 127.0.0.1 -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      AUTH_SECRET: "playwright-only-auth-secret-with-at-least-32-bytes",
      AUTH_THROTTLE_SECRET:
        "playwright-only-throttle-secret-with-at-least-32-bytes",
      AUTH_TRUST_HOST: "true",
      AUTH_GOOGLE_ENABLED: "false",
      SAVED_CONTENT_ENABLED: "true",
      NEXT_PUBLIC_GTM_ID: "GTM-TEST123",
      NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}`,
    },
  },
});
