import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { interceptGoogle as intercept, release2EventContract } from "./analytics-contract";

// GA4-direct mode (NEXT_PUBLIC_GA4_ID only). gtag.js is stubbed; every other
// Google request is aborted and recorded, so no real traffic leaves the test.

// gtag() pushes `arguments` objects; return them as plain arrays.
async function commands(page: Page) {
  return page.evaluate(() => (window.dataLayer || [])
    .filter((entry) => Object.prototype.toString.call(entry) === "[object Arguments]")
    .map((entry) => Array.from(entry as IArguments)) as unknown[][]);
}
async function gaEvents(page: Page, name?: string) {
  return (await commands(page)).filter((c) => c[0] === "event" && (!name || c[1] === name)) as [string, string, Record<string, unknown>][];
}

async function choose(page: Page, choice: "Accept analytics" | "Reject analytics") {
  await page.getByRole("button", { name: choice, exact: true }).click();
  await expect(page.getByRole("region", { name: "Cookie settings", exact: true })).toBeHidden();
}

test("GA4 direct: consent gate, config, page views, clicks and withdrawal", async ({ context, page }) => {
  const requests = await intercept(context, "ga4");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  // (a) Before consent: no script, no requests, no queued commands.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Accept analytics", exact: true })).toBeVisible();
  await expect(page.locator("#haus-gtag")).toHaveCount(0);
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(await commands(page)).toEqual([]);

  // (b) Reject persists across reload.
  await choose(page, "Reject analytics");
  await page.reload({ waitUntil: "domcontentloaded" });
  // The footer is server-rendered before ConsentManager's settings listener
  // hydrates. Wait for the document's scripts before reopening that control.
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "Accept analytics", exact: true })).toBeHidden();
  await expect(page.locator("#haus-gtag")).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(await commands(page)).toEqual([]);

  // (c) Accept: exactly one gtag.js with the measurement ID, manual page views only.
  await page.getByRole("button", { name: "Cookie Settings", exact: true }).click();
  await choose(page, "Accept analytics");
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123456");
  await expect(page.locator("#haus-gtag")).toHaveCount(1);
  await expect(page.locator("#haus-gtm")).toHaveCount(0);
  expect(await page.locator("#haus-gtag").getAttribute("src")).toContain("id=G-TEST123456");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __gtagStubLoads?: number }).__gtagStubLoads)).toBe(1);
  const configs = (await commands(page)).filter((c) => c[0] === "config");
  expect(configs).toHaveLength(1);
  expect(configs[0][1]).toBe("G-TEST123456");
  expect((configs[0][2] as Record<string, unknown>).send_page_view).toBe(false);
  expect((configs[0][2] as Record<string, unknown>).allow_google_signals).toBe(false);
  // GA4 mode uses gtag commands only; no GTM-style plain {event} pushes.
  expect(await page.evaluate(() => (window.dataLayer || []).some((e) => !("length" in e) && "event" in e))).toBe(false);
  expect(await gaEvents(page, "page_view")).toHaveLength(1);
  expect((await gaEvents(page, "page_view"))[0][2]).toMatchObject({ page_path: "/", page_location: "https://hausofestate.com/" });

  await page.locator('footer a[href="/about"]').click();
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(async () => (await gaEvents(page, "page_view")).length).toBe(2);
  await page.evaluate(() => history.pushState({}, "", "?email=private@example.com#secret"));
  await expect(page).toHaveURL(/email=/);
  expect(await gaEvents(page, "page_view")).toHaveLength(2);

  // (d) Property and article clicks carry a sanitized content_path.
  await page.locator('footer a[href^="/properties"]').first().click();
  await expect(page).toHaveURL(/\/properties/);
  const propertyHref = await page.locator('main a[href^="/properties/"]').first().getAttribute("href");
  await page.locator('main a[href^="/properties/"]').first().click();
  await expect(page).toHaveURL(/\/properties\/[a-z-]+/);
  await expect.poll(async () => (await gaEvents(page, "property_click")).length).toBe(1);
  expect((await gaEvents(page, "property_click"))[0][2].content_path).toBe(new URL(propertyHref!, "http://x").pathname);
  await page.locator('footer a[href="/blog"]').click();
  await expect(page).toHaveURL(/\/blog$/);
  await page.locator('main a[href^="/blog/"]').first().click();
  await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+/);
  await expect.poll(async () => (await gaEvents(page, "article_click")).length).toBe(1);
  expect((await gaEvents(page, "article_click"))[0][2].content_path).toMatch(/^\/blog\/[a-z0-9-]+$/);

  // One page_view per distinct pathname; no PII anywhere in the queue.
  const paths = (await gaEvents(page, "page_view")).map((e) => e[2].page_path);
  expect(new Set(paths).size).toBe(paths.length);
  expect(paths.length).toBeGreaterThanOrEqual(5);
  await page.locator('footer a[href="/contact"]').click();
  await expect.poll(async () => (await gaEvents(page, "contact_click")).length).toBe(1);
  expect((await gaEvents(page, "contact_click"))[0][2].contact_method).toBe("contact");
  await page.locator('a[href="/"]').first().click();
  await page.getByRole("form", { name: "Find a property", exact: true })
    .getByRole("button", { name: "Search properties", exact: true }).click();
  await expect(page).toHaveURL(/\/properties/);
  await expect.poll(async () => (await gaEvents(page, "property_search")).length).toBe(1);
  expect(await gaEvents(page, "lead_submit_success")).toEqual([]);
  expect(await gaEvents(page, "generate_lead")).toEqual([]);
  expect(JSON.stringify(await commands(page))).not.toMatch(/private@example|secret|localhost/);
  expect(requests).toHaveLength(1);
  expect((await context.cookies()).some((c) => c.name === "_ga")).toBe(true);

  // (e) Withdrawal via footer Cookie Settings reloads and removes the tag.
  await page.getByRole("button", { name: "Cookie Settings", exact: true }).click();
  await Promise.all([page.waitForEvent("domcontentloaded"), page.getByRole("button", { name: "Reject analytics", exact: true }).click()]);
  await expect(page.locator("#haus-gtag")).toHaveCount(0);
  await expect.poll(async () => (await context.cookies()).some((c) => c.name === "_ga")).toBe(false);
  expect(await commands(page)).toEqual([]);
  expect(requests).toHaveLength(1);
  expect(errors).toEqual([]);
});

test("GA4 direct: accepted consent stays off private, preview, draft routes and unlisted hosts", async ({ context, page }) => {
  const requests = await intercept(context, "ga4");
  await context.addInitScript(() => localStorage.setItem("haus.analytics-consent.v1",
    JSON.stringify({ version: 1, analytics: "granted", expiresAt: Date.now() + 86_400_000 })));
  await page.goto("/");
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.locator("#haus-gtag")).toHaveCount(1);
  const privateDocument = page.waitForRequest((r) => r.isNavigationRequest() && r.url().includes("/auth/login"));
  await page.evaluate(() => history.pushState({}, "", "/auth/login"));
  await privateDocument;
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator("#haus-gtag")).toHaveCount(0);
  expect(requests).toHaveLength(1);
  await page.goBack();
  await expect(page).toHaveURL("http://localhost:3132/");
  await expect.poll(() => requests.length).toBe(2);
  await page.goForward();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator("#haus-gtag")).toHaveCount(0);
  for (const path of ["/studio", "/dev/property-previews", "/saved", "/?preview=true"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#haus-gtag")).toHaveCount(0);
    expect(await gaEvents(page)).toEqual([]);
    expect(requests).toHaveLength(2);
  }
  await page.goto("http://127.0.0.1:3132/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#haus-gtag")).toHaveCount(0);
  expect(requests).toHaveLength(2);
  const manifest = JSON.parse(readFileSync(".next-analytics-ga4/prerender-manifest.json", "utf8"));
  await context.addCookies([{ name: "__prerender_bypass", value: manifest.preview.previewModeId, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Exit preview", exact: true })).toBeVisible();
  await expect(page.locator("#haus-gtag")).toHaveCount(0);
  expect(await gaEvents(page)).toEqual([]);
  expect(requests).toHaveLength(2);
});

test("GA4 direct: withdrawal in another tab unloads both documents", async ({ context, page }) => {
  const requests = await intercept(context, "ga4");
  await page.goto("/");
  await choose(page, "Accept analytics");
  const second = await context.newPage();
  await second.goto("/about");
  await expect.poll(() => requests.length).toBe(2);
  await second.getByRole("button", { name: "Cookie Settings", exact: true }).click();
  await Promise.all([page.waitForEvent("domcontentloaded"), second.waitForEvent("domcontentloaded"), second.getByRole("button", { name: "Reject analytics", exact: true }).click()]);
  for (const tab of [page, second]) {
    await expect(tab.locator("#haus-gtag")).toHaveCount(0);
    expect(await commands(tab)).toEqual([]);
  }
  expect((await context.cookies()).some((cookie) => cookie.name === "_ga")).toBe(false);
  expect(requests).toHaveLength(2);
});

release2EventContract("ga4");
