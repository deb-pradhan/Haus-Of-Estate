import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "analytics.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3131", trace: "retain-on-failure" },
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
      NEXT_PUBLIC_GTM_ID: "GTM-TEST123",
      NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS: "localhost",
      // Explicit hostname opt-in must work for a controlled preview build.
      VERCEL_ENV: "preview",
    },
  },
});
