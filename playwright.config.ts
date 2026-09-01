import { defineConfig, devices } from "@playwright/test";

const port = 3210;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 7_500 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@mobile/,
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      grep: /@mobile/,
    },
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      LEAD_INTAKE_ENABLED: "true",
      LEAD_DELIVERY_ENABLED: "false",
      PURCHASE_READINESS_ENABLED: "true",
      AUTH_SECRET: "playwright-only-auth-secret-with-at-least-32-bytes",
      AUTH_URL: baseURL,
      AUTH_THROTTLE_SECRET:
        "playwright-only-throttle-secret-with-at-least-32-bytes",
      AUTH_TRUST_HOST: "true",
      AUTH_GOOGLE_ENABLED: "false",
      SAVED_CONTENT_ENABLED: "true",
      PROPERTY_ASSISTANT_ENABLED: "true",
      NEXT_PUBLIC_GTM_ID: "GTM-TEST123",
      NEXT_PUBLIC_SITE_URL: baseURL,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://johndoe:randompassword@127.0.0.1:5432/mydb?schema=public",
      SANITY_API_READ_TOKEN: "",
      SANITY_API_BROWSER_TOKEN: "",
      SANITY_REVALIDATE_SECRET: "",
    },
  },
});
