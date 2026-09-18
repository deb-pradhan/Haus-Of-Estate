import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const consentKey = "haus.analytics-consent.v1";
const consent = { version: 1, analytics: "granted", expiresAt: Date.now() + 86_400_000 };

async function interceptGoogle(context: BrowserContext) {
  const requests: string[] = [];
  await context.route(/https?:\/\/([^/]*\.)?(googletagmanager\.com|google-analytics\.com|google\.com|googleadservices\.com|doubleclick\.net)\//, async (route) => {
    requests.push(route.request().url());
    if (route.request().url().includes("/gtm.js")) {
      await route.fulfill({ contentType: "application/javascript", body: 'window.google_tag_manager = {"G-TEST": {}}; document.cookie = "_ga=browser-test; Path=/; SameSite=Lax";' });
    } else await route.abort();
  });
  return requests;
}

async function events(page: Page) {
  return page.evaluate(() => (window.dataLayer || []).filter((entry) => "event" in entry && String(entry.event).startsWith("haus_")) as Record<string, unknown>[]);
}

async function choose(page: Page, choice: "Accept analytics" | "Reject analytics") {
  await page.getByRole("button", { name: choice, exact: true }).click();
  await expect(page.getByRole("region", { name: "Cookie settings", exact: true })).toBeHidden();
}

test("consent, navigation, clicks, search and withdrawal work without sending real Google traffic", async ({ context, page }, testInfo) => {
  const requests = await interceptGoogle(context);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Accept analytics", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reject analytics", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("consent-prompt.png"), fullPage: false });
  expect(requests).toEqual([]);
  expect(await events(page)).toEqual([]);
  await choose(page, "Reject analytics");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Accept analytics", exact: true })).toBeHidden();
  expect(requests).toEqual([]);

  await page.getByRole("button", { name: "Cookie Settings", exact: true }).click();
  await choose(page, "Accept analytics");
  await expect.poll(() => requests.length).toBe(1);
  expect((await events(page)).filter((event) => event.event === "haus_page_view")).toHaveLength(1);
  const identity = await page.evaluate(() => { const marker = crypto.randomUUID(); Object.assign(window, { browserDocumentMarker: marker }); return marker; });
  await page.locator('footer a[href="/about"]').click();
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(async () => (await events(page)).filter((event) => event.event === "haus_page_view").length).toBe(2);
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).browserDocumentMarker)).toBe(identity);
  await page.evaluate(() => history.pushState({}, "", "?email=private@example.com#secret"));
  await expect(page).toHaveURL(/email=/);
  expect((await events(page)).filter((event) => event.event === "haus_page_view")).toHaveLength(2);
  expect(JSON.stringify(await events(page))).not.toMatch(/private@example|secret/);

  await page.locator('footer a[href^="/properties"]').first().click();
  await expect(page).toHaveURL(/\/properties/);
  await page.locator('main a[href^="/properties/"]').first().click();
  await expect(page).toHaveURL(/\/properties\/[a-z-]+/);
  await expect.poll(async () => (await events(page)).some((event) => event.event === "haus_property_click")).toBe(true);
  await page.locator('footer a[href="/blog"]').click();
  await expect(page).toHaveURL(/\/blog$/);
  await page.locator('main a[href^="/blog/"]').first().click();
  await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+/);
  await expect.poll(async () => (await events(page)).some((event) => event.event === "haus_article_click")).toBe(true);
  await page.locator('footer a[href="/contact"]').click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect.poll(async () => (await events(page)).some((event) => event.event === "haus_contact_click" && event.contact_method === "contact")).toBe(true);

  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL("http://localhost:3131/");
  await page.getByRole("button", { name: "Find my match", exact: true }).click();
  await expect(page).toHaveURL(/\/properties/);
  await expect.poll(async () => (await events(page)).filter((event) => event.event === "haus_property_search").length).toBe(1);
  expect((await events(page)).some((event) => event.event === "lead_form_submit")).toBe(false);
  expect(requests).toHaveLength(1);
  expect((await context.cookies()).some((cookie) => cookie.name === "_ga")).toBe(true);

  await page.getByRole("button", { name: "Cookie Settings", exact: true }).click();
  await Promise.all([page.waitForEvent("domcontentloaded"), page.getByRole("button", { name: "Reject analytics", exact: true }).click()]);
  await expect(page.locator("#haus-gtm")).toHaveCount(0);
  await expect.poll(async () => (await context.cookies()).some((cookie) => cookie.name === "_ga")).toBe(false);
  expect(await events(page)).toEqual([]);
  expect(requests).toHaveLength(1);
  expect(errors).toEqual([]);
});

test("accepted consent never loads analytics on private, preview, draft, or unlisted hosts", async ({ context, page }) => {
  const requests = await interceptGoogle(context);
  await context.addInitScript(({ consentKey, consent }) => localStorage.setItem(consentKey, JSON.stringify(consent)), { consentKey, consent });
  await page.goto("/");
  await expect.poll(() => requests.length).toBe(1);
  const privateDocument = page.waitForRequest((request) => request.isNavigationRequest() && request.url().includes("/auth/login"));
  await page.evaluate(() => history.pushState({}, "", "/auth/login"));
  await privateDocument;
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator("#haus-gtm")).toHaveCount(0);
  expect(requests).toHaveLength(1);
  await page.goBack();
  await expect(page).toHaveURL("http://localhost:3131/");
  await expect.poll(() => requests.length).toBe(2);
  expect((await events(page)).filter((event) => event.event === "haus_page_view")).toHaveLength(1);
  await page.goForward();
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator("#haus-gtm")).toHaveCount(0);
  expect(requests).toHaveLength(2);
  await page.goto("/studio", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#haus-gtm")).toHaveCount(0);
  expect(requests).toHaveLength(2);
  await page.goto("/?preview=true");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await events(page)).toEqual([]);
  expect(requests).toHaveLength(2);
  await page.goto("http://127.0.0.1:3131/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#haus-gtm")).toHaveCount(0);
  expect(requests).toHaveLength(2);

  const manifest = JSON.parse(readFileSync(".next-analytics/prerender-manifest.json", "utf8"));
  await context.addCookies([{ name: "__prerender_bypass", value: manifest.preview.previewModeId, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Exit preview", exact: true })).toBeVisible();
  await expect(page.locator("#haus-gtm")).toHaveCount(0);
  expect(requests).toHaveLength(2);
});

test("withdrawing consent in another tab unloads already active analytics", async ({ context, page }) => {
  const requests = await interceptGoogle(context);
  await page.goto("/");
  await choose(page, "Accept analytics");
  const second = await context.newPage();
  await second.goto("/about");
  await expect.poll(() => requests.length).toBe(2);
  await second.getByRole("button", { name: "Cookie Settings", exact: true }).click();
  await Promise.all([
    page.waitForEvent("domcontentloaded"), second.waitForEvent("domcontentloaded"),
    second.getByRole("button", { name: "Reject analytics", exact: true }).click(),
  ]);
  await expect(page.locator("#haus-gtm")).toHaveCount(0);
  await expect(second.locator("#haus-gtm")).toHaveCount(0);
  expect(await events(page)).toEqual([]);
  expect(await events(second)).toEqual([]);
  expect(requests).toHaveLength(2);
});
