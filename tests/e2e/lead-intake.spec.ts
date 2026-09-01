import { expect, test, type Page } from "@playwright/test";

const API_PATTERN = "**/api/leads";
const MATCH_LABEL = /Email me properties and opportunities matching this brief/;
const NEWSLETTER_LABEL = /Email me the Haus of Estate newsletter/;
const OVERSEAS_CASH_BUYER_LABEL = /I am a cash buyer purchasing from overseas/i;
const SOCIAL_PROFILE_NAMES = [
  "Instagram",
  "LinkedIn",
  "Facebook",
  "Pinterest",
  "YouTube",
  "X",
] as const;

async function chooseInterestAndReachContact(
  page: Page,
  interest: "Buy" | "Newsletter only" = "Buy",
) {
  await page
    .locator("label")
    .filter({ hasText: new RegExp(`^${interest}`) })
    .click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: /Shape your search|What interests you/ }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Where should we reach you?" }),
  ).toBeFocused();
}

async function enterRequiredContact(page: Page) {
  await page.getByLabel("First name").fill("Surya");
  await page.getByLabel("Email address").fill("surya@example.com");
}

test("opens after three seconds, only once per session, and restores focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(2_500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1_500 });

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/about");
  await page.waitForTimeout(3_200);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const trigger = page.getByRole("button", { name: "Speak to an advisor" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("does not auto-open on explicitly excluded public routes", async ({
  page,
}) => {
  for (const path of [
    "/register-interest",
    "/contact",
    "/legal/privacy-policy",
    "/list-property",
  ]) {
    await page.goto(path);
    await page.waitForTimeout(3_100);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

test("manual opening cancels the pending automatic popup", async ({ page }) => {
  await page.goto("/about");
  const trigger = page.getByRole("button", { name: "Speak to an advisor" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(3_200);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("preserves attribution, separates consent, retries, and emits no PII", async ({
  page,
}) => {
  const submissions: Record<string, unknown>[] = [];
  let attempts = 0;
  await page.route(API_PATTERN, async (route) => {
    attempts += 1;
    submissions.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status: attempts === 1 ? 503 : 201,
      contentType: "application/json",
      body: JSON.stringify(
        attempts === 1
          ? { error: "Lead intake is temporarily unavailable" }
          : { success: true, status: "created", leadId: "lead-test" },
      ),
    });
  });

  await page.goto(
    "/register-interest?utm_source=instagram&utm_medium=organic_social&utm_campaign=bio",
  );
  await chooseInterestAndReachContact(page);
  const contactStep = page.getByRole("region", {
    name: "Where should we reach you?",
  });
  await expect(
    contactStep.getByLabel(OVERSEAS_CASH_BUYER_LABEL),
  ).not.toBeChecked();
  await expect(contactStep.getByLabel(MATCH_LABEL)).not.toBeChecked();
  await expect(contactStep.getByLabel(NEWSLETTER_LABEL)).not.toBeChecked();
  for (const platform of SOCIAL_PROFILE_NAMES) {
    await expect(
      contactStep.getByRole("link", {
        name: `Follow Haus of Estate on ${platform}`,
      }),
    ).toBeVisible();
  }
  await enterRequiredContact(page);
  await contactStep.getByLabel(OVERSEAS_CASH_BUYER_LABEL).check();
  await contactStep.getByLabel(MATCH_LABEL).check();
  await contactStep.getByLabel(NEWSLETTER_LABEL).check();
  await page.getByRole("button", { name: "Send my brief" }).click();

  await expect(
    page.getByRole("alert").filter({
      hasText: "We could not save your enquiry just now",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send my brief" }).click();
  await expect(
    page.getByRole("heading", { name: "Brief received" }),
  ).toBeVisible();

  expect(submissions).toHaveLength(2);
  expect(submissions[1]).toMatchObject({
    overseasCashBuyer: true,
    propertyMatchOptIn: true,
    newsletterOptIn: true,
    context: {
      surface: "register_interest",
      pagePath: "/register-interest",
      utmSource: "instagram",
      utmMedium: "organic_social",
      utmCampaign: "bio",
    },
  });
  expect(submissions[1].submissionId).toBe(submissions[0].submissionId);
  await expect(
    page
      .getByRole("status")
      .getByRole("link", { name: "Follow Haus of Estate on Instagram" }),
  ).toHaveAttribute("href", "https://www.instagram.com/haus_of_estate/");

  const events = await page.evaluate(() => window.dataLayer ?? []);
  expect(events.map((event) => event.event)).toEqual([
    "form_view",
    "form_start",
    "lead_submit_success",
    "newsletter_opt_in",
  ]);
  const serializedEvents = JSON.stringify(events);
  expect(serializedEvents).not.toContain("Surya");
  expect(serializedEvents).not.toContain("surya@example.com");
});

test("submits without a phone or marketing consent", async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route(API_PATTERN, async (route) => {
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, leadId: "lead-no-phone" }),
    });
  });

  await page.goto("/register-interest");
  await chooseInterestAndReachContact(page);
  await enterRequiredContact(page);
  await page.getByRole("button", { name: "Send my brief" }).click();
  await expect(
    page.getByRole("heading", { name: "Brief received" }),
  ).toBeVisible();

  expect(payload).toMatchObject({
    overseasCashBuyer: false,
    propertyMatchOptIn: false,
    newsletterOptIn: false,
  });
  expect((payload?.contact as Record<string, unknown>).phone).toBeUndefined();
});

test("announces validation and focuses the first invalid contact field", async ({
  page,
}) => {
  await page.goto("/register-interest");
  await chooseInterestAndReachContact(page);

  const firstName = page.getByLabel("First name");
  const email = page.getByLabel("Email address");
  await expect(firstName).toHaveAttribute("required", "");
  await expect(email).toHaveAttribute("required", "");

  await page.getByRole("button", { name: "Send my brief" }).click();
  await expect(firstName).toBeFocused();
  await expect(
    page.getByRole("alert").filter({ hasText: "Enter your first name" }),
  ).toBeVisible();

  await firstName.fill("Surya");
  await page.getByRole("button", { name: "Send my brief" }).click();
  await expect(email).toBeFocused();
  await expect(
    page.getByRole("alert").filter({ hasText: "Enter a valid email" }),
  ).toBeVisible();
});

test("freezes consent during a slow submission and announces success", async ({
  page,
}) => {
  let releaseResponse: (() => void) | undefined;
  const waitForRelease = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(API_PATTERN, async (route) => {
    await waitForRelease;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, leadId: "lead-slow" }),
    });
  });

  await page.goto("/register-interest");
  await chooseInterestAndReachContact(page, "Newsletter only");
  await enterRequiredContact(page);
  const consent = page.getByLabel(NEWSLETTER_LABEL);
  await consent.check();
  await page.getByRole("button", { name: "Subscribe" }).click();

  await expect(consent).toBeDisabled();
  await expect(consent).toBeChecked();
  releaseResponse?.();
  const success = page.getByRole("status");
  await expect(success).toContainText("Subscription confirmed");
  await expect(success).toBeFocused();
});

test("newsletter CTAs retain the entered email without prechecking consent", async ({
  page,
}) => {
  await page.goto("/about");
  await page.getByPlaceholder("Your email address").fill("reader@example.com");
  await page.getByRole("button", { name: "Subscribe" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /^Newsletter only/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Email address")).toHaveValue(
    "reader@example.com",
  );
  await expect(dialog.getByLabel(NEWSLETTER_LABEL)).not.toBeChecked();
  await dialog.getByRole("button", { name: "Subscribe" }).click();
  await expect(dialog.getByLabel(NEWSLETTER_LABEL)).toBeFocused();
  await expect(
    dialog
      .getByRole("alert")
      .filter({ hasText: "Choose the newsletter option" }),
  ).toBeVisible();
});

test("@mobile renders and completes the compact three-step flow", async ({
  page,
}) => {
  await page.route(API_PATTERN, (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, leadId: "lead-mobile" }),
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 4_000 });
  const bodyWidth = await page.locator("body").evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(bodyWidth.scroll).toBe(bodyWidth.client);
  await page.keyboard.press("Escape");

  await page.goto("/register-interest");
  await expect(
    page.getByRole("heading", { name: "Register your interest" }),
  ).toBeVisible();
  await chooseInterestAndReachContact(page, "Newsletter only");
  const mobileWidth = await page.locator("body").evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(mobileWidth.scroll).toBe(mobileWidth.client);
  await enterRequiredContact(page);
  await page.getByLabel(NEWSLETTER_LABEL).check();
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(
    page.getByRole("heading", { name: "Subscription confirmed" }),
  ).toBeVisible();
});

test("@mobile keeps the complete contact form within a 320px viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/register-interest");
  await chooseInterestAndReachContact(page);

  const contactStep = page.getByRole("region", {
    name: "Where should we reach you?",
  });
  const form = contactStep.locator("xpath=ancestor::form");
  const documentWidth = await page.locator("html").evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  const formWidth = await form.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));

  expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client);
  expect(formWidth.scroll).toBeLessThanOrEqual(formWidth.client);
});

test("valid project links preselect published property context", async ({
  page,
}) => {
  let payload: Record<string, unknown> | undefined;
  await page.route(API_PATTERN, async (route) => {
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, leadId: "lead-project" }),
    });
  });

  await page.goto("/register-interest?project=monaco-mansions");
  await expect(page.getByText("Selected property")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Bedrooms")).toHaveValue("6");
  await page.getByRole("button", { name: "Continue" }).click();
  await enterRequiredContact(page);
  await page.getByRole("button", { name: "Send my brief" }).click();
  await expect(
    page.getByRole("heading", { name: "Brief received" }),
  ).toBeVisible();
  expect(payload).toMatchObject({ project: { slug: "monaco-mansions" } });
});

test("ignores invalid or unpublished project query values", async ({
  page,
}) => {
  await page.goto("/register-interest?project=not-a-published-property");
  await expect(page.getByText("Selected property")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Register your interest" }),
  ).toBeVisible();
});
