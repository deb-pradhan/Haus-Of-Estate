import { defineConfig, devices } from "@playwright/test";

// GA4-direct mode: no GTM container, only a GA4 measurement ID. NEXT_PUBLIC_*
// values are inlined at build time, so this suite needs its own production
// build (it overwrites .next, like the GTM suite). Set ANALYTICS_SKIP_BUILD=1 to
// reuse an existing .next that was built with exactly this env.
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "analytics-ga4.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3132", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `${process.env.ANALYTICS_SKIP_BUILD === "1" ? "" : "npm run build && "}npm run start -- --hostname 127.0.0.1 --port 3132`,
    url: "http://localhost:3132",
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_GTM_ID: "",
      NEXT_PUBLIC_GA4_ID: "G-TEST123456",
      NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS: "localhost",
      VERCEL_ENV: "preview",
    },
  },
});
