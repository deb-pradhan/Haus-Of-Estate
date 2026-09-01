import { expect, test } from "@playwright/test";

test.describe("authentication hardening", () => {
  test("sanitizes return paths and keeps Google disabled", async ({ page }) => {
    await page.goto(
      "/auth/login?returnTo=https%3A%2F%2Fattacker.example%2Fcollect",
    );

    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toHaveCount(0);

    const forgotHref = await page
      .getByRole("link", { name: "Forgot password?" })
      .getAttribute("href");
    expect(forgotHref).toBe("/auth/forgot-password?returnTo=%2F");
  });

  test("preserves a safe destination through login and registration", async ({
    page,
  }) => {
    await page.goto("/auth/login?returnTo=%2Fsaved%3Ftab%3Darticles");

    await expect(
      page.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute(
      "href",
      "/auth/register?returnTo=%2Fsaved%3Ftab%3Darticles",
    );
  });

  test("registration sends account fields without lead or consent data", async ({
    page,
  }) => {
    let submittedBody: Record<string, unknown> | undefined;
    await page.route("**/api/auth/register", async (route) => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/auth/register?returnTo=%2Fsaved");
    await page.getByLabel("Full name").fill("Surya Kommuri");
    await page.getByLabel("Email").fill("surya@example.com");
    await page.getByLabel("Password", { exact: true }).fill("secure-password");
    await page.getByLabel("Confirm password").fill("secure-password");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
    expect(submittedBody).toEqual({
      name: "Surya Kommuri",
      email: "surya@example.com",
      password: "secure-password",
      returnTo: "/saved",
    });
    expect(JSON.stringify(submittedBody)).not.toMatch(
      /lead|intent|consent|newsletter/i,
    );
  });

  test("completes the verification-link interface", async ({ page }) => {
    const externalRequests: string[] = [];
    let verificationBody: Record<string, unknown> | undefined;
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.hostname !== "127.0.0.1") externalRequests.push(url.toString());
    });
    await page.route("**/api/auth/verify-email", async (route) => {
      verificationBody = route.request().postDataJSON() as Record<
        string,
        unknown
      >;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(
      "/auth/verify-email?token=abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG&returnTo=%2Fsaved",
    );
    await expect(
      page.getByRole("heading", { name: "Verify your email" }),
    ).toBeVisible();
    expect(verificationBody).toBeUndefined();
    await page.getByRole("button", { name: "Verify email" }).click();
    await expect(
      page.getByRole("heading", { name: "Email verified" }),
    ).toBeVisible();
    await expect(page).toHaveURL(
      /\/auth\/verify-email\?returnTo=%2Fsaved&ready=1$/,
    );
    expect(page.url()).not.toContain("token=");
    expect(verificationBody).toEqual({});
    expect(externalRequests).toEqual([]);
    await expect(
      page.getByRole("link", { name: "Continue to sign in" }),
    ).toHaveAttribute("href", "/auth/login?returnTo=%2Fsaved");
  });

  test("redirects a signed-out visitor from a protected route", async ({
    page,
  }) => {
    await page.goto("/saved?tab=properties");
    await expect(page).toHaveURL(
      /\/auth\/login\?returnTo=%2Fsaved%3Ftab%3Dproperties$/,
    );
  });

  test("auth screens fit the current viewport without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/auth/register");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });
});
