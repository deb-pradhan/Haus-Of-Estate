import { expect, test, type Page } from "@playwright/test";

async function mockGuestSession(page: Page) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "null",
    });
  });
}

async function mockAuthenticatedSession(page: Page) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "assistant-e2e-user", email: "member@example.com" },
        expires: "2099-01-01T00:00:00.000Z",
      }),
    });
  });
}

function assistantStream(chunks: Array<Record<string, unknown>>) {
  return `${chunks
    .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
    .join("")}data: [DONE]\n\n`;
}

function textStream(messageId: string, text: string) {
  return assistantStream([
    { type: "start", messageId },
    { type: "start-step" },
    { type: "text-start", id: `${messageId}-text` },
    { type: "text-delta", id: `${messageId}-text`, delta: text },
    { type: "text-end", id: `${messageId}-text` },
    { type: "finish-step" },
    { type: "finish", finishReason: "stop" },
  ]);
}

const assistantHeaders = {
  "content-type": "text/event-stream",
  "cache-control": "no-cache",
  "x-vercel-ai-ui-message-stream": "v1",
};

test("the assistant is route-scoped and restores launcher focus", async ({
  page,
}) => {
  await mockGuestSession(page);
  await page.goto("/");

  const launcher = page.getByRole("button", {
    name: "Open Haus Property Assistant",
  });
  await expect(launcher).toBeVisible();
  await launcher.click();

  const panel = page.getByRole("dialog", {
    name: "Haus Property Assistant",
  });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(/Responses are AI-generated and can be wrong/)).toBeVisible();
  await expect(panel.getByText(/Do not enter bank, payment, passport/)).toBeVisible();
  await expect(panel.getByRole("textbox", { name: "Ask about Haus properties" })).toBeFocused();
  await expect(page.locator('a[aria-label="Chat on WhatsApp"]')).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();

  await page.goto("/properties");
  const naturalSearch = page.getByRole("textbox", {
    name: "Search in your own words",
  });
  await naturalSearch.fill("Ready homes in Dubai");
  await page.getByRole("button", { name: "Ask Haus", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Haus Property Assistant" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Haus Property Assistant" }),
  ).toBeHidden();
  await expect(naturalSearch).toBeFocused();

  await page.goto("/about");
  await expect(
    page.getByRole("button", { name: "Open Haus Property Assistant" }),
  ).toHaveCount(0);
});

test("the mobile assistant is a full-height accessible sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGuestSession(page);
  await page.goto("/properties");
  await page
    .getByRole("button", { name: "Open Haus Property Assistant" })
    .click();

  const panel = page.getByRole("dialog", {
    name: "Haus Property Assistant",
  });
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(389);
  expect(box!.height).toBeGreaterThanOrEqual(843);
  await expect(
    panel.getByRole("button", { name: "Close Haus Property Assistant" }),
  ).toBeVisible();
});

test("a guest draft survives the safe sign-in return without an API call", async ({
  page,
}) => {
  let signedIn = false;
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: signedIn
        ? JSON.stringify({
            user: { id: "return-e2e-user", email: "member@example.com" },
            expires: "2099-01-01T00:00:00.000Z",
          })
        : "null",
    });
  });
  await page.route("**/api/auth/providers", async (route) => {
    const origin = new URL(route.request().url()).origin;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        credentials: {
          id: "credentials",
          name: "Credentials",
          type: "credentials",
          signinUrl: `${origin}/api/auth/signin/credentials`,
          callbackUrl: `${origin}/api/auth/callback/credentials`,
        },
      }),
    });
  });
  await page.route("**/api/auth/csrf", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ csrfToken: "playwright-csrf-token" }),
    });
  });
  await page.route("**/api/auth/callback/credentials**", async (route) => {
    signedIn = true;
    const origin = new URL(route.request().url()).origin;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: `${origin}/properties` }),
    });
  });
  let assistantRequests = 0;
  await page.route("**/api/property-assistant", async (route) => {
    assistantRequests += 1;
    await route.abort();
  });
  await page.goto("/properties");

  const naturalSearch = page.getByRole("textbox", {
    name: "Search in your own words",
  });
  await naturalSearch.fill("Ready two-bedroom homes in Dubai");
  await page.getByRole("button", { name: "Ask Haus", exact: true }).click();

  const assistantInput = page.getByRole("textbox", {
    name: "Ask about Haus properties",
  });
  await expect(assistantInput).toHaveValue("Ready two-bedroom homes in Dubai");
  await page
    .getByRole("button", { name: "Sign in to ask this question" })
    .click();

  await expect(page).toHaveURL(/\/auth\/login\?returnTo=%2Fproperties$/);
  expect(assistantRequests).toBe(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.sessionStorage.getItem(
          "haus:property-assistant:v1:draft",
        ),
      ),
    )
    .toBe("Ready two-bedroom homes in Dubai");

  await page.getByLabel("Email").fill("member@example.com");
  await page.getByLabel("Password").fill("a-valid-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/properties$/);
  const reopenedInput = page.getByRole("textbox", {
    name: "Ask about Haus properties",
  });
  await expect(reopenedInput).toBeVisible();
  await expect(reopenedInput).toHaveValue("Ready two-bedroom homes in Dubai");
});

test("authenticated results stay validated and hand off an editable brief", async ({
  page,
}) => {
  await mockAuthenticatedSession(page);
  const requestBodies: Array<Record<string, unknown>> = [];
  let leadRequests = 0;
  let assistantRequest = 0;
  await page.route("**/api/leads", async (route) => {
    leadRequests += 1;
    await route.abort();
  });
  await page.route("**/api/property-assistant", async (route) => {
    requestBodies.push(await route.request().postDataJSON());
    assistantRequest += 1;
    if (assistantRequest > 1) {
      await route.fulfill({
        status: 200,
        headers: assistantHeaders,
        body: textStream("assistant-2", "The current cards remain the source of truth."),
      });
      return;
    }

    const properties = Array.from({ length: 4 }, (_, index) => ({
      id: `property-${index + 1}`,
      title: `Downtown Home ${index + 1}`,
      slug: `downtown-home-${index + 1}`,
      path: `/properties/downtown-home-${index + 1}`,
      community: "Downtown Dubai",
      city: "Dubai",
      country: "United Arab Emirates",
      category: "residential",
      availability: ["ready"],
      listingType: ["sale"],
      unitType: "Apartment",
      bedrooms: 2,
      bathrooms: 2,
      priceDisplay: `AED ${index + 1},000,000`,
    }));
    await route.fulfill({
      status: 200,
      headers: assistantHeaders,
      body: assistantStream([
        { type: "start", messageId: "assistant-1" },
        { type: "start-step" },
        {
          type: "tool-input-available",
          toolCallId: "property-search-1",
          toolName: "searchPublishedProperties",
          input: { location: "Dubai", minBedrooms: 2 },
        },
        {
          type: "tool-output-available",
          toolCallId: "property-search-1",
          output: {
            properties,
            recognizedFilters: { location: "Dubai", minBedrooms: 2 },
            viewAllPath: "/properties?location=Dubai&beds=2",
          },
        },
        { type: "finish-step" },
        { type: "start-step" },
        { type: "text-start", id: "assistant-1-text" },
        {
          type: "text-delta",
          id: "assistant-1-text",
          delta: "These are current published matches.",
        },
        { type: "text-end", id: "assistant-1-text" },
        { type: "finish-step" },
        { type: "finish", finishReason: "stop" },
      ]),
    });
  });

  await page.goto("/properties");
  await page
    .getByRole("textbox", { name: "Search in your own words" })
    .fill("Ready two-bedroom homes in Dubai");
  await page.getByRole("button", { name: "Ask Haus", exact: true }).click();
  const assistantInput = page.getByRole("textbox", {
    name: "Ask about Haus properties",
  });
  await page.getByRole("button", { name: "Send question" }).click();

  const results = page.locator('[aria-label="Property results"]');
  await expect(page.getByRole("log", { name: "Assistant conversation" })).toBeVisible();
  await expect(results.locator("article")).toHaveCount(3);
  await expect(results.getByRole("link", { name: /View all matches/ })).toHaveAttribute(
    "href",
    "/properties?location=Dubai&beds=2",
  );
  const resultsEvent = await page.evaluate(() =>
    window.dataLayer?.find(
      (event) => event.event === "property_assistant_results_shown",
    ),
  );
  expect(resultsEvent).toEqual({
    event: "property_assistant_results_shown",
    route_scope: "properties",
    result_count: 3,
  });

  await assistantInput.fill("Which is available now?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText("The current cards remain the source of truth.")).toBeVisible();
  expect(requestBodies).toHaveLength(2);
  const messages = requestBodies[1].messages as Array<{
    id: string;
    role: string;
    parts: Array<Record<string, unknown>>;
  }>;
  expect(messages.map((message) => message.role)).toEqual([
    "user",
    "assistant",
    "user",
  ]);
  for (const message of messages) {
    expect(Object.keys(message).sort()).toEqual(["id", "parts", "role"]);
    expect(message.parts.every((part) => part.type === "text")).toBe(true);
    expect(message.parts.every((part) => Object.keys(part).sort().join() === "text,type")).toBe(true);
  }
  expect(JSON.stringify(requestBodies[1])).not.toMatch(
    /tool-|reasoning|source-|file|email|phone|referrer/i,
  );

  await results
    .getByRole("button", {
      name: "Discuss Downtown Home 1 with an adviser",
    })
    .click();
  const leadDialog = page.getByRole("dialog");
  await expect(
    leadDialog.getByRole("heading", {
      name: "How can we help?",
    }),
  ).toBeVisible();
  await expect(
    leadDialog.getByRole("radio", { name: /^Buy\b/ }),
  ).toBeChecked();
  await expect(leadDialog).not.toContainText("Ready two-bedroom homes in Dubai");
  await leadDialog.getByRole("button", { name: "Continue" }).click();
  await expect(
    leadDialog.getByRole("heading", { name: "Shape your search" }),
  ).toBeVisible();
  await expect(leadDialog.getByLabel("Market")).toHaveValue("Dubai");
  await expect(leadDialog.getByLabel("Preferred location")).toHaveValue(
    "Downtown Dubai",
  );
  await expect(leadDialog.getByLabel("Bedrooms")).toHaveValue("2");
  expect(leadRequests).toBe(0);

  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Open Haus Property Assistant" })
    .click();
  await page.getByRole("button", { name: /Continue with an adviser/ }).click();
  const blankLeadDialog = page.getByRole("dialog");
  await expect(
    blankLeadDialog.getByRole("radio", { name: /^Buy\b/ }),
  ).not.toBeChecked();
  await expect(
    blankLeadDialog.getByRole("radio", { name: /^Rent\b/ }),
  ).not.toBeChecked();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Open Haus Property Assistant" })
    .click();
  await page.getByRole("button", { name: "Clear assistant conversation" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.sessionStorage.getItem(
          "haus:property-assistant:v1:messages",
        ),
      ),
    )
    .toBeNull();
});

test("provider failures keep the question and offer a working retry", async ({
  page,
}) => {
  await mockAuthenticatedSession(page);
  let attempts = 0;
  await page.route("**/api/property-assistant", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "The assistant is temporarily unavailable." }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: assistantHeaders,
      body: textStream("assistant-retry", "The retry completed safely."),
    });
  });

  await page.goto("/");
  await page
    .getByRole("button", { name: "Open Haus Property Assistant" })
    .click();
  await page
    .getByRole("textbox", { name: "Ask about Haus properties" })
    .fill("Show current listings");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(
    page.getByText("The assistant could not complete that answer."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("The retry completed safely.")).toBeVisible();
  expect(attempts).toBe(2);
});

test("session history is isolated when the authenticated account changes", async ({
  page,
}) => {
  let userId = "assistant-user-a";
  const requestBodies: Array<Record<string, unknown>> = [];
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: userId, email: `${userId}@example.com` },
        expires: "2099-01-01T00:00:00.000Z",
      }),
    });
  });
  await page.route("**/api/property-assistant", async (route) => {
    requestBodies.push(await route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      headers: assistantHeaders,
      body: textStream(
        `answer-${requestBodies.length}`,
        requestBodies.length === 1
          ? "Only the first account should see this answer."
          : "The second account starts with clean context.",
      ),
    });
  });

  await page.goto("/");
  await page
    .getByRole("button", { name: "Open Haus Property Assistant" })
    .click();
  const input = page.getByRole("textbox", { name: "Ask about Haus properties" });
  await input.fill("A private question from account A");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(
    page.getByText("Only the first account should see this answer."),
  ).toBeVisible();

  userId = "assistant-user-b";
  await page.reload();
  await page
    .getByRole("button", { name: "Open Haus Property Assistant" })
    .click();
  await expect(
    page.getByText("Only the first account should see this answer."),
  ).toHaveCount(0);
  await input.fill("A new question from account B");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(
    page.getByText("The second account starts with clean context."),
  ).toBeVisible();

  expect(requestBodies).toHaveLength(2);
  expect(JSON.stringify(requestBodies[1])).not.toContain(
    "A private question from account A",
  );
});
