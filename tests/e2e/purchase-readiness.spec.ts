import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("haus_lead_popup_seen_v4", "true");
  });
});

test("explains the protected sequence and hands off to a property enquiry", async ({
  page,
}) => {
  const nonNavigationRequests: string[] = [];
  page.on("request", (request) => {
    if (!["document", "stylesheet", "image", "font", "script"].includes(request.resourceType())) {
      nonNavigationRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  await page.goto("/properties/monaco-mansions");

  const readiness = page.getByTestId("purchase-readiness");
  await expect(readiness).toBeVisible();
  await expect(
    readiness.getByRole("heading", { name: "How protected payment works" }),
  ).toBeVisible();
  await expect(readiness.getByText("No payment is taken here")).toBeVisible();
  await expect(readiness.getByRole("listitem")).toHaveCount(5);
  await expect(readiness.getByText(/Haus does not receive or forward/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Pay deposit|Make payment/i })).toHaveCount(0);

  await readiness.getByRole("button", { name: "Request purchase details" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Azizi Monaco Mansions", { exact: true }),
  ).toBeVisible();
  expect(nonNavigationRequests.filter((request) => request.startsWith("POST "))).toEqual([]);
});

test("@mobile keeps the guide within the viewport", async ({ page }) => {
  await page.goto("/properties/monaco-mansions");
  await expect(page.getByTestId("purchase-readiness")).toBeVisible();

  const width = await page.locator("body").evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(width.scroll).toBe(width.client);
});
