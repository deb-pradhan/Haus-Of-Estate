import assert from "node:assert/strict";
import test from "node:test";
import { analyticsPage } from "../src/lib/analytics.ts";
import {
  CAREERS_PUBLIC_ENABLED,
  careersUnavailableResponse,
  isCareersPath,
} from "../src/lib/careers-availability.ts";

test("careers stays closed until an approved reopening change", () => {
  assert.equal(CAREERS_PUBLIC_ENABLED, false);
  assert.equal(analyticsPage("https://hausofestate.com/careers"), null);
  assert.equal(analyticsPage("https://hausofestate.com/careers/real-estate-agents"), null);
});

test("the takedown covers the entire careers segment without hiding other pages", () => {
  for (const path of ["/careers", "/careers/", "/careers/interior-designer", "/careers/unknown/deeper", "/Careers/role", "/careers%2Frole", "/%63areers/role"]) {
    assert.equal(isCareersPath(path), true, path);
  }
  for (const path of ["/", "/contact", "/careers-news", "/blog/careers", "/properties", "/bad%escape"]) {
    assert.equal(isCareersPath(path), false, path);
  }
});

test("closed page is a non-cacheable real 404 without recruitment content", async () => {
  const response = careersUnavailableResponse();
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Return to Haus of Estate/);
  assert.doesNotMatch(html, /Life at HoE|7721|<form|Apply for|JobPosting/);
});

// Run against a built LOCAL preview only; never submit tests to production.
const baseUrl = process.env.HAUS_CAREERS_TEST_URL;
test("built app closes page, role, prefetch and application entry points", { skip: !baseUrl }, async () => {
  const origin = new URL(baseUrl);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname), "Use a local preview, not a public server");
  for (const path of ["/careers", "/careers/", "/careers/interior-design-intern", "/careers/content-managers", "/careers/unknown", "/careers/unknown?_rsc=closure-check"]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(new URL(path, origin), { method });
      assert.equal(response.status, 404, `${method} ${path}`);
      assert.equal(response.headers.get("x-robots-tag"), "noindex");
      assert.equal(response.headers.get("cache-control"), "no-store");
      if (method === "GET") {
        assert.doesNotMatch(await response.text(), /Life at HoE|7721|<form|Apply for|JobPosting/);
      }
    }
  }
  const prefetch = await fetch(new URL("/careers/content-managers?_rsc=closure-check", origin), {
    headers: { RSC: "1", "Next-Router-Prefetch": "1" },
  });
  assert.equal(prefetch.status, 404);
  assert.doesNotMatch(await prefetch.text(), /Apply for|JobPosting|7721/);

  // An unreadable body would have failed parsing if the closure guard ran too late.
  const application = await fetch(new URL("/api/applications", origin), {
    method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=missing" }, body: "invalid form",
  });
  assert.equal(application.status, 404);
  assert.deepEqual(await application.json(), { error: "Applications are currently closed." });
  assert.equal(application.headers.get("cache-control"), "no-store");

  const sitemap = await fetch(new URL("/sitemap.xml", origin));
  assert.equal(sitemap.status, 200);
  assert.doesNotMatch(await sitemap.text(), /\/careers(?:<|\/)/);
  for (const path of ["/", "/about", "/contact"]) {
    const page = await fetch(new URL(path, origin));
    assert.equal(page.status, 200, path);
    const html = await page.text();
    assert.doesNotMatch(html, /href=["']\/careers(?:["'/#?])/);
  }
});
