import { expect, test, type Page } from "@playwright/test";

const PROPERTY_PATH = "/properties/monaco-mansions";
const BLOG_PATH = "/blog/uae-property-market-2026";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("haus_lead_popup_seen_v3", "true");
  });
});

async function disableNativeShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });
}

test("uses native sharing with the canonical article URL", async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __shareCalls?: ShareData[];
    };
    target.__shareCalls = [];
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload: ShareData) => {
        target.__shareCalls?.push(payload);
      },
    });
  });

  await page.goto(`${BLOG_PATH}?utm_source=test#summary`);
  await page.getByRole("button", { name: "Share this article" }).click();

  const calls = await page.evaluate(
    () =>
      (window as typeof window & { __shareCalls?: ShareData[] }).__shareCalls ??
      [],
  );
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe(
    "https://hausofestate.com/blog/uae-property-market-2026",
  );
  expect(calls[0].title).toBeTruthy();
  await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0);
});

test("treats native share cancellation as a quiet dismissal", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new DOMException("Cancelled", "AbortError");
      },
    });
  });
  await page.goto(BLOG_PATH);
  await page.getByRole("button", { name: "Share this article" }).click();
  await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0);
});

test("opens fallback actions and copies only the canonical property URL", async ({
  page,
}) => {
  await disableNativeShare(page);
  await page.addInitScript(() => {
    const target = window as typeof window & { __copied?: string[] };
    target.__copied = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          target.__copied?.push(value);
        },
      },
    });
  });

  await page.goto(`${PROPERTY_PATH}?utm_campaign=private#gallery`);
  const aside = page.locator("aside");
  await aside.getByRole("button", { name: "Share this property" }).click();
  const fallback = page.locator('[data-slot="popover-content"]');
  await expect(fallback).toBeVisible();
  await fallback.getByRole("button", { name: "Copy link" }).click();

  expect(
    await page.evaluate(
      () => (window as typeof window & { __copied?: string[] }).__copied,
    ),
  ).toEqual(["https://hausofestate.com/properties/monaco-mansions"]);
  await expect(aside.getByRole("status")).toHaveText("Link copied");

  const platformLinks = fallback.getByRole("link");
  await expect(platformLinks).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) {
    await expect(platformLinks.nth(index)).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  }
});

test("shows a selectable canonical URL when clipboard access fails", async ({
  page,
}) => {
  await disableNativeShare(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException("Denied", "NotAllowedError");
        },
      },
    });
  });
  await page.goto(PROPERTY_PATH);
  const aside = page.locator("aside");
  await aside.getByRole("button", { name: "Share this property" }).click();
  const fallback = page.locator('[data-slot="popover-content"]');
  await fallback.getByRole("button", { name: "Copy link" }).click();
  await expect(fallback.getByLabel("Copy this link manually")).toHaveValue(
    "https://hausofestate.com/properties/monaco-mansions",
  );
  await expect(aside.getByRole("status")).toContainText(
    "Clipboard unavailable",
  );
});

test("shows an accessible desktop article rail with 44px targets", async ({
  page,
}) => {
  await disableNativeShare(page);
  await page.goto(BLOG_PATH);

  const rail = page.getByRole("group", {
    name: "Share this article directly",
  });
  await expect(rail).toBeVisible();
  const targets = rail.locator("button, a");
  await expect(targets).toHaveCount(7);
  for (let index = 0; index < 7; index += 1) {
    const box = await targets.nth(index).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test("a failed native share opens the keyboard-dismissable fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new Error("Provider unavailable");
      },
    });
  });
  await page.goto(BLOG_PATH);
  const trigger = page.getByRole("button", { name: "Share this article" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-slot="popover-content"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("@mobile places one share action beside property discovery content", async ({
  page,
}) => {
  await disableNativeShare(page);
  await page.goto(PROPERTY_PATH);
  const trigger = page.getByRole("button", { name: "Share this property" });
  await expect(trigger).toHaveCount(1);
  await expect(trigger).toBeVisible();
  const box = await trigger.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);

  const widths = await page.locator("body").evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(widths.scroll).toBe(widths.client);
});
