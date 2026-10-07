import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "analytics.spec.ts",
  outputDir: "test-results-analytics",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3131", trace: "retain-on-failure", serviceWorkers: "block" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `${process.env.ANALYTICS_SKIP_BUILD === "1" ? "" : "npm run build && "}npm run start -- --hostname 127.0.0.1 --port 3131`,
    url: "http://localhost:3131",
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      HAUS_NEXT_DIST_DIR: ".next-analytics",
      AUTH_TRUST_HOST: "true",
      AUTH_SECRET: "analytics-browser-only-secret-with-at-least-32-bytes",
      AUTH_URL: "http://localhost:3131",
      NEXT_PUBLIC_GTM_ID: "GTM-TEST123",
      NEXT_PUBLIC_GA4_ID: "G-TEST123456",
      NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS: "localhost",
      AUTH_ENABLED: "false",
      SAVED_CONTENT_ENABLED: "false",
      PROPERTY_ASSISTANT_ENABLED: "false",
      LEAD_INTAKE_ENABLED: "false",
      LEAD_DELIVERY_ENABLED: "false",
      LEAD_SHEETS_ENABLED: "false",
      CAREERS_INTAKE_ENABLED: "false",
      SNAGGING_BOOKING_ENABLED: "false",
      PURCHASE_READINESS_ENABLED: "false",
      NEXT_TELEMETRY_DISABLED: "1",
      // Explicit hostname opt-in must work for a controlled preview build.
      VERCEL_ENV: "preview",
    },
  },
});
