import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CAREERS_PUBLIC_ENABLED,
  careersUnavailableResponse,
  isCareersPath,
} from "../src/lib/careers-availability.ts";

const roles = JSON.parse(readFileSync(new URL("../content/careers-roles.json", import.meta.url), "utf8"));

test("approved careers pages are enabled independently of application intake", () => {
  assert.equal(CAREERS_PUBLIC_ENABLED, true);
  assert.equal(roles.length, 9);
  assert.equal(new Set(roles.map(({ slug }) => slug)).size, 9);
});

test("careers path matching covers encoded and nested paths without hiding other pages", () => {
  for (const path of ["/careers", "/careers/", "/careers/interior-designer", "/careers/unknown/deeper", "/Careers/role", "/careers%2Frole", "/%63areers/role"]) {
    assert.equal(isCareersPath(path), true, path);
  }
  for (const path of ["/", "/contact", "/careers-news", "/blog/careers", "/properties", "/bad%escape"]) {
    assert.equal(isCareersPath(path), false, path);
  }
});

test("retired page response remains a non-cacheable real 404 without recruitment content", async () => {
  const response = careersUnavailableResponse();
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Return to Haus of Estate/);
  assert.doesNotMatch(html, /Life at HoE|7721|<form|Apply for|JobPosting/);
});

// Run against a built LOCAL preview with CAREERS_INTAKE_ENABLED=false.
// This test submits only an unreadable synthetic body; never use a public host.
const baseUrl = process.env.HAUS_CAREERS_TEST_URL;
test("built app exposes reviewed vacancies while closing old URLs and application intake", { skip: !baseUrl }, async () => {
  const origin = new URL(baseUrl);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname), "Use a local preview, not a public server");
  for (const path of ["/careers/interior-design-intern", "/careers/content-managers", "/careers/real-estate-agents", "/careers/pr-interns", "/careers/videographers", "/careers/lead-generators", "/careers/unknown", "/careers/unknown?_rsc=closure-check"]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(new URL(path, origin), { method });
      assert.equal(response.status, 404, `${method} ${path}`);
      assert.equal(response.headers.get("x-robots-tag"), "noindex");
      assert.equal(response.headers.get("cache-control"), "no-store");
      if (method === "GET") assert.doesNotMatch(await response.text(), /Life at HoE|7721|<form|Apply for|JobPosting/);
    }
  }
  const prefetch = await fetch(new URL("/careers/content-managers?_rsc=closure-check", origin), {
    headers: { RSC: "1", "Next-Router-Prefetch": "1" },
  });
  assert.equal(prefetch.status, 404);
  assert.doesNotMatch(await prefetch.text(), /Apply for|JobPosting|7721/);

  for (const path of ["/careers", ...roles.map(({ slug }) => `/careers/${slug}`)]) {
    const response = await fetch(new URL(path, origin));
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /Online applications are not open yet/);
    assert.doesNotMatch(html, /Life at HoE|447721096676|af-name|af-cv|Submit application|JobPosting/);
  }

  const application = await fetch(new URL("/api/applications", origin), {
    method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=missing" }, body: "invalid form",
  });
  assert.equal(application.status, 404);
  assert.deepEqual(await application.json(), { error: "Online applications are not open yet." });
  assert.equal(application.headers.get("cache-control"), "no-store");

  const sitemap = await fetch(new URL("/sitemap.xml", origin));
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.match(xml, /\/careers<\/loc>/);
  assert.doesNotMatch(xml, /\/careers\/(?:content-managers|real-estate-agents|pr-interns|videographers|lead-generators)<\/loc>/);
  for (const path of ["/", "/about", "/contact"]) {
    const page = await fetch(new URL(path, origin));
    assert.equal(page.status, 200, path);
    assert.match(await page.text(), /href=["']\/careers["']/);
  }
});
