import { expect, test } from "@playwright/test";

test("a guest can save a published property locally without navigating", async ({
  page,
}) => {
  await page.goto("/properties/al-furjan");

  const saveButton = page.locator('main button[aria-pressed]').first();
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toHaveAccessibleName(/^Save /);
  await expect(saveButton).toHaveAttribute("aria-pressed", "false");

  const originalUrl = page.url();
  await saveButton.click();

  await expect(page).toHaveURL(originalUrl);
  await expect(saveButton).toHaveAttribute("aria-pressed", "true");
  const localSaves = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("haus:saved-content:v1") ?? "[]"),
  );
  expect(localSaves).toEqual([
    expect.objectContaining({
      contentType: "PROPERTY",
      sanityDocumentId: expect.any(String),
    }),
  ]);

  await page.reload();
  await expect(page.locator('main button[aria-pressed="true"]').first())
    .toHaveAccessibleName(/^Remove .* from saved properties$/);
});

test("the protected saved page preserves its login return path", async ({ page }) => {
  await page.goto("/saved");
  await expect(page).toHaveURL(/\/auth\/login\?returnTo=%2Fsaved$/);
});

test("a guest can bookmark an article without opening the card", async ({ page }) => {
  await page.goto("/blog");

  const saveButton = page.locator('article button[aria-pressed]').first();
  await expect(saveButton).toBeVisible();
  const originalUrl = page.url();
  await saveButton.click();

  await expect(page).toHaveURL(originalUrl);
  await expect(saveButton).toHaveAttribute("aria-pressed", "true");
  const localSaves = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("haus:saved-content:v1") ?? "[]"),
  );
  expect(localSaves).toEqual([
    expect.objectContaining({
      contentType: "ARTICLE",
      sanityDocumentId: expect.any(String),
    }),
  ]);
});

test("a guest save rolls back when browser storage is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "haus:saved-content:v1") {
        throw new DOMException("Storage unavailable", "QuotaExceededError");
      }
      return setItem.call(this, key, value);
    };
  });
  await page.goto("/properties/al-furjan");

  const saveButton = page.locator('button[aria-pressed]').first();
  await expect(saveButton).toHaveAttribute("aria-pressed", "false");
  await saveButton.click();

  await expect(saveButton).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByText("Could not update saved items. Please try again."),
  ).toBeAttached();
});

test("a transient anonymous merge failure retries during the same session", async ({
  page,
}) => {
  let putAttempts = 0;

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "haus:saved-content:v1",
      JSON.stringify([
        {
          contentType: "PROPERTY",
          sanityDocumentId: "property-retry-test",
        },
      ]),
    );
  });
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "saved-e2e-user", email: "saved@example.com" },
        expires: "2099-01-01T00:00:00.000Z",
      }),
    });
  });
  await page.route("**/api/saved", async (route) => {
    if (route.request().method() === "PUT") {
      putAttempts += 1;
      await route.fulfill({
        status: putAttempts === 1 ? 503 : 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: putAttempts > 1 }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, items: [] }),
    });
  });

  await page.goto("/");

  await expect.poll(() => putAttempts, { timeout: 10_000 }).toBe(2);
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(window.localStorage.getItem("haus:saved-content:v1") ?? "[]"),
      ),
    )
    .toEqual([]);
});
