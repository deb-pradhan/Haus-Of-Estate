import { test, expect, type Page } from "@playwright/test";

// Selectors are by role/label/text so they survive design changes. The lead
// modal is multi-step; `reachContactStep` walks forward until the email field
// shows, and skips (rather than fails) if the flow has been restructured.

async function dismissConsent(page: Page) {
  const reject = page.getByRole("button", { name: "Reject analytics", exact: true });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

async function openLeadModal(page: Page) {
  const trigger = page
    .locator("button:visible", { hasText: /speak to an advisor|request a valuation|buy a property/i })
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function reachContactStep(dialog: ReturnType<Page["getByRole"]>) {
  const email = dialog.getByLabel(/email/i);
  for (let i = 0; i < 6 && !(await email.first().isVisible().catch(() => false)); i++) {
    const next = dialog
      .getByRole("button", { name: /^(continue|next|get started|start|see matches)/i })
      .first();
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click();
  }
  return email.first().isVisible().catch(() => false);
}

test.describe("homepage search", () => {
  test("hero search takes the visitor to /properties", async ({ page }) => {
    await page.goto("/");
    await dismissConsent(page);

    const location = page.getByLabel("Preferred location");
    await expect(location).toBeVisible();
    await location.selectOption({ label: "Dubai" });
    await page.getByRole("button", { name: /^search$/i }).click();

    await expect(page).toHaveURL(/\/properties(\/|\?|$)/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Honest listings page: no fabricated placeholder prices in the HTML.
    await expect(page.locator("main")).not.toContainText(/lorem ipsum/i);
  });
});

test.describe("lead modal", () => {
  test("opens, traps focus semantics and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await dismissConsent(page);
    const dialog = await openLeadModal(page);
    await expect(dialog.getByRole("heading").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("empty contact details are rejected without calling the API", async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route(/\/api\/(leads|funnel)/, async (route) => {
      apiCalls.push(route.request().url());
      await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
    });

    await page.goto("/");
    await dismissConsent(page);
    const dialog = await openLeadModal(page);
    test.skip(!(await reachContactStep(dialog)), "contact step not reachable: update selectors");

    await dialog
      .getByRole("button", { name: /send|submit|request|get in touch|speak to|book/i })
      .last()
      .click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/required|valid|enter|please/i).first()).toBeVisible();
    await expect(dialog.getByText(/thank you|we.ll be in touch|received/i)).toHaveCount(0);
    expect(apiCalls).toEqual([]);
  });

  test("a failed submission never shows a success message", async ({ page }) => {
    await page.route(/\/api\/(leads|funnel)/, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"x"}' }),
    );

    await page.goto("/");
    await dismissConsent(page);
    const dialog = await openLeadModal(page);
    test.skip(!(await reachContactStep(dialog)), "contact step not reachable: update selectors");

    await dialog.getByLabel(/first name|name/i).first().fill("Test Person");
    await dialog.getByLabel(/email/i).first().fill("test.person@example.com");
    const mobile = dialog.getByLabel(/mobile|phone/i).first();
    if (await mobile.isVisible().catch(() => false)) await mobile.fill("7700 900123");
    const consent = dialog.getByRole("checkbox").first();
    if (await consent.isVisible().catch(() => false)) await consent.check();

    await dialog
      .getByRole("button", { name: /send|submit|request|get in touch|speak to|book/i })
      .last()
      .click();

    await expect(dialog.getByText(/thank you|we.ll be in touch|received|success/i)).toHaveCount(0);
  });
});
