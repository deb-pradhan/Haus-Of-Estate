import { expect, test, type Page } from "@playwright/test";

const turnstileScriptUrl =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const fakeTurnstileScript = String.raw`
(() => {
  const widgets = new Map();
  let widgetSequence = 0;
  let tokenSequence = 0;
  let latestWidgetId = null;

  const telemetry = {
    renderActions: [],
    renderSiteKeys: [],
    resetCalls: [],
    removeCalls: [],
    tokens: [],
    triggerError() {
      const widget = latestWidgetId ? widgets.get(latestWidgetId) : null;
      if (widget) widget.options["error-callback"]();
    },
    triggerUnsupported() {
      const widget = latestWidgetId ? widgets.get(latestWidgetId) : null;
      if (widget) widget.options["unsupported-callback"]();
    },
  };

  function mount(widgetId) {
    const widget = widgets.get(widgetId);
    if (!widget) return;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Complete security check";
    button.dataset.testid = "fake-turnstile-control";
    button.style.width = "100%";
    button.style.minHeight = "44px";
    button.style.border = "1px solid #8c9690";
    button.style.background = "#ffffff";

    button.addEventListener("click", () => {
      tokenSequence += 1;
      const token =
        "playwright-turnstile-token-" +
        widget.options.action +
        "-" +
        tokenSequence;
      telemetry.tokens.push(token);
      button.textContent = "Security check complete";
      button.disabled = true;
      widget.options.callback(token);
    });

    widget.container.replaceChildren(button);
  }

  window.__turnstileTest = telemetry;
  window.turnstile = {
    render(container, options) {
      widgetSequence += 1;
      const widgetId = "playwright-widget-" + widgetSequence;
      latestWidgetId = widgetId;
      widgets.set(widgetId, { container, options });
      telemetry.renderActions.push(options.action);
      telemetry.renderSiteKeys.push(options.sitekey);
      mount(widgetId);
      return widgetId;
    },
    reset(widgetId) {
      telemetry.resetCalls.push(widgetId);
      mount(widgetId);
    },
    remove(widgetId) {
      telemetry.removeCalls.push(widgetId);
      const widget = widgets.get(widgetId);
      if (widget) widget.container.replaceChildren();
      widgets.delete(widgetId);
      if (latestWidgetId === widgetId) latestWidgetId = null;
    },
  };
})();
`;

type TurnstileTelemetry = {
  renderActions: string[];
  renderSiteKeys: string[];
  resetCalls: string[];
  removeCalls: string[];
  tokens: string[];
  triggerError: () => void;
  triggerUnsupported: () => void;
};

async function installFakeTurnstile(page: Page) {
  await page.route(turnstileScriptUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: fakeTurnstileScript,
    });
  });
}

function telemetry(page: Page) {
  return page.evaluate(() => {
    return (window as unknown as { __turnstileTest?: TurnstileTelemetry })
      .__turnstileTest;
  });
}

test.describe("Turnstile bot protection", () => {
  test.beforeEach(async ({ page }) => {
    await installFakeTurnstile(page);
  });

  test("requires a registration challenge and resets it after failures", async ({
    page,
  }) => {
    const submissions: Array<Record<string, unknown>> = [];
    await page.route("**/api/auth/register", async (route) => {
      submissions.push(
        route.request().postDataJSON() as Record<string, unknown>,
      );

      if (submissions.length === 1) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            code: "BOT_CHALLENGE_REJECTED",
            error: "Complete the security check and try again.",
          }),
        });
        return;
      }

      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/auth/register?returnTo=%2Fsaved");

    const challenge = page.getByTestId("turnstile-register");
    const submit = page.getByRole("button", { name: "Create account" });
    await expect(challenge).toBeVisible();
    await expect(submit).toBeDisabled();
    await expect
      .poll(
        async () => ((await telemetry(page))?.renderActions.length ?? 0) > 0,
      )
      .toBe(true);
    const initialTelemetry = await telemetry(page);
    expect(
      initialTelemetry?.renderActions.every((action) => action === "register"),
    ).toBe(true);
    expect(
      initialTelemetry?.renderSiteKeys.every(
        (siteKey) => siteKey === "1x00000000000000000000AA",
      ),
    ).toBe(true);

    await page.evaluate(() => {
      (
        window as unknown as { __turnstileTest: TurnstileTelemetry }
      ).__turnstileTest.triggerError();
    });
    await expect(challenge.getByRole("status")).toContainText(
      "could not be completed",
    );
    await challenge.getByRole("button", { name: "Retry" }).click();
    await expect
      .poll(async () => (await telemetry(page))?.resetCalls.length ?? 0)
      .toBe(1);
    await expect(submit).toBeDisabled();

    await page.getByLabel("Full name").fill("Surya Kommuri");
    await page.getByLabel("Email").fill("surya@example.com");
    await page.getByLabel("Password", { exact: true }).fill("secure-password");
    await page.getByLabel("Confirm password").fill("secure-password");
    await challenge
      .getByRole("button", { name: "Complete security check" })
      .click();
    await expect(challenge.getByRole("status")).toContainText(
      "Security check complete",
    );
    await expect(submit).toBeEnabled();
    const renderCountBeforeFailure =
      (await telemetry(page))?.renderActions.length ?? 0;
    await submit.click();

    await expect(
      page.getByText("Complete the security check and try again.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(submit).toBeDisabled();
    await expect
      .poll(
        async () =>
          ((await telemetry(page))?.renderActions.length ?? 0) >
          renderCountBeforeFailure,
      )
      .toBe(true);
    expect(
      (await telemetry(page))?.removeCalls.length ?? 0,
    ).toBeGreaterThanOrEqual(1);

    await page
      .getByTestId("turnstile-register")
      .getByRole("button", { name: "Complete security check" })
      .click();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();

    expect(submissions).toHaveLength(2);
    expect(submissions[0].turnstileToken).toMatch(
      /^playwright-turnstile-token-register-/,
    );
    expect(submissions[1].turnstileToken).toMatch(
      /^playwright-turnstile-token-register-/,
    );
    expect(submissions[1].turnstileToken).not.toBe(
      submissions[0].turnstileToken,
    );

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("protects password recovery without changing its generic response", async ({
    page,
  }) => {
    let submittedBody: Record<string, unknown> | undefined;
    await page.route("**/api/auth/forgot-password", async (route) => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/auth/forgot-password?returnTo=%2Fsaved");
    const challenge = page.getByTestId("turnstile-forgot_password");
    const submit = page.getByRole("button", { name: "Send reset link" });
    await expect(challenge).toBeVisible();
    await expect(submit).toBeDisabled();
    await page.getByLabel("Email").fill("surya@example.com");
    await challenge
      .getByRole("button", { name: "Complete security check" })
      .click();
    await submit.click();

    await expect(
      page.getByText(
        "If an eligible account exists for that address, a password reset link is on its way.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(submittedBody).toEqual({
      email: "surya@example.com",
      returnTo: "/saved",
      turnstileToken: "playwright-turnstile-token-forgot_password-1",
    });
  });

  test("fails closed when the browser cannot run the challenge", async ({
    page,
  }) => {
    await page.goto("/auth/register");
    const challenge = page.getByTestId("turnstile-register");
    const submit = page.getByRole("button", { name: "Create account" });
    await expect
      .poll(
        async () => ((await telemetry(page))?.renderActions.length ?? 0) > 0,
      )
      .toBe(true);

    await page.evaluate(() => {
      (
        window as unknown as { __turnstileTest: TurnstileTelemetry }
      ).__turnstileTest.triggerUnsupported();
    });

    await expect(challenge.getByRole("status")).toContainText(
      "cannot run the security check",
    );
    await expect(challenge.getByRole("button", { name: "Reload" })).toBeVisible();
    await expect(submit).toBeDisabled();
  });

  test("protects requests for a fresh verification link", async ({ page }) => {
    let submittedBody: Record<string, unknown> | undefined;
    await page.route("**/api/auth/resend-verification", async (route) => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/auth/verify?returnTo=%2Fsaved");
    const challenge = page.getByTestId("turnstile-resend_verification");
    const submit = page.getByRole("button", {
      name: "Send verification link",
    });
    await expect(challenge).toBeVisible();
    await expect(submit).toBeDisabled();
    await page.getByLabel("Email").fill("surya@example.com");
    await challenge
      .getByRole("button", { name: "Complete security check" })
      .click();
    await submit.click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
    expect(submittedBody).toEqual({
      email: "surya@example.com",
      returnTo: "/saved",
      turnstileToken: "playwright-turnstile-token-resend_verification-1",
    });
  });
});
