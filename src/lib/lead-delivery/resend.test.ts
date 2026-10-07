import { describe, expect, it, vi } from "vitest";
import { readResendLeadConfig } from "./resend-config";
import { ResendLeadDeliveryTransport } from "./resend";
import { buildLeadDeliveryPayload } from "./payload";

const now = Date.parse("2026-09-25T12:00:00Z");
const environment = {
  RESEND_API_KEY: "re_unit_test_only",
  LEAD_NOTIFICATION_TO: "info@hausofestate.com",
};
const config = readResendLeadConfig(environment);
const context = { attempts: 1, createdAt: new Date(now - 60_000) };
const payload = buildLeadDeliveryPayload({
  eventId: "outbox-123",
  leadId: "lead-123",
  submittedAt: new Date(now - 60_000),
  firstName: "Test",
  surname: "Enquiry",
  email: "visitor@example.test",
  phone: "+447700900000",
  interest: "buy",
  market: "United Kingdom",
  propertyMatchOptIn: false,
  newsletterOptIn: false,
  overseasCashBuyer: false,
  message: "A question for the team.",
});

describe("Resend notification configuration", () => {
  it("reuses the shared company sender without requiring another mail service", () => {
    expect(config).toEqual({
      apiKey: environment.RESEND_API_KEY,
      fromEmail: "noreply@hausofestate.com",
      toEmail: "info@hausofestate.com",
      timeoutMs: 8_000,
    });
    expect(
      readResendLeadConfig({
        ...environment,
        RESEND_FROM_EMAIL: "MAIL@hausofestate.com",
        LEAD_DELIVERY_TIMEOUT_MS: "2500",
      }).fromEmail,
    ).toBe("mail@hausofestate.com");
    expect(
      readResendLeadConfig({
        ...environment,
        LEAD_DELIVERY_TIMEOUT_MS: "60000",
      }).timeoutMs,
    ).toBe(8_000);
  });

  it("rejects missing credentials, placeholder keys, header injection and noncompany mailboxes", () => {
    for (const key of [undefined, "", "re_xxx", "re_key\r\nheader:value"]) {
      expect(() =>
        readResendLeadConfig({ ...environment, RESEND_API_KEY: key }),
      ).toThrow("RESEND_API_KEY");
    }
    for (const email of [
      "outside@example.test",
      "Name <info@hausofestate.com>",
      "a@hausofestate.com,b@hausofestate.com",
      "a@hausofestate.com\r\nBcc:outside@example.test",
    ]) {
      expect(() =>
        readResendLeadConfig({ ...environment, RESEND_FROM_EMAIL: email }),
      ).toThrow("RESEND_FROM_EMAIL");
      expect(() =>
        readResendLeadConfig({ ...environment, LEAD_NOTIFICATION_TO: email }),
      ).toThrow("LEAD_NOTIFICATION_TO");
    }
    expect(() =>
      readResendLeadConfig({ ...environment, LEAD_NOTIFICATION_TO: "" }),
    ).toThrow("LEAD_NOTIFICATION_TO");
  });
});

describe("Resend lead notification", () => {
  it("sends operational details with a stable idempotency key across retries", async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ id: "email-123" })));
    const transport = new ResendLeadDeliveryTransport(config, send, () => now);
    await transport.deliver(payload, "notification", context);
    send.mockResolvedValue(new Response(JSON.stringify({ id: "email-123" })));
    await transport.deliver(payload, "notification", {
      ...context,
      attempts: 2,
    });
    const [url, request] = send.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request?.redirect).toBe("error");
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer re_unit_test_only",
      "Idempotency-Key": expect.stringMatching(/^haus-lead-[a-f0-9]{64}$/),
    });
    expect(send.mock.calls[1][1]?.headers).toEqual(request?.headers);
    expect(send.mock.calls[1][1]?.body).toEqual(request?.body);
    const body = JSON.parse(String(request?.body));
    expect(body.to).toEqual(["info@hausofestate.com"]);
    expect(body.reply_to).toBe("visitor@example.test");
    expect(body.text).toContain("Newsletter opt-in: No");
    expect(body.text).toContain("A question for the team.");
    expect(body).not.toHaveProperty("html");
  });

  it("does not reconstruct a reply address from a lossy Excel-escaped alias", async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ id: "email-123" })));
    await new ResendLeadDeliveryTransport(config, send, () => now).deliver(
      { ...payload, row: { ...payload.row, email: "'+alias@example.test" } },
      "notification",
      context,
    );
    expect(JSON.parse(String(send.mock.calls[0][1]?.body))).not.toHaveProperty(
      "reply_to",
    );
  });

  it.each([
    [400, {}, false],
    [401, {}, false],
    [408, {}, true],
    [429, {}, true],
    [503, {}, true],
    [409, { name: "concurrent_idempotent_requests" }, true],
    [409, { name: "invalid_idempotent_request" }, false],
  ])(
    "classifies provider %s failures without logging response content",
    async (status, body, retryable) => {
      const send = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify(body), { status }));
      await expect(
        new ResendLeadDeliveryTransport(config, send, () => now).deliver(
          payload,
          "notification",
          context,
        ),
      ).rejects.toMatchObject({ code: `RESEND_HTTP_${status}`, retryable });
    },
  );

  it.each([{}, { id: "" }, { id: "email-123", error: "rejected" }])(
    "rejects an ambiguous success acknowledgement %j",
    async (body) => {
      const send = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(JSON.stringify(body)));
      await expect(
        new ResendLeadDeliveryTransport(config, send, () => now).deliver(
          payload,
          "notification",
          context,
        ),
      ).rejects.toMatchObject({ code: "RESEND_INVALID_ACK", retryable: true });
    },
  );

  it("bounds requests and marks transport failures retryable", async () => {
    const failed = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("network includes sensitive detail"));
    await expect(
      new ResendLeadDeliveryTransport(config, failed, () => now).deliver(
        payload,
        "notification",
        context,
      ),
    ).rejects.toMatchObject({ code: "RESEND_NETWORK", retryable: true });
    const timeout = vi.fn<typeof fetch>().mockImplementation(
      (_url, request) =>
        new Promise((_, reject) => {
          request?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
    );
    await expect(
      new ResendLeadDeliveryTransport(
        { ...config, timeoutMs: 10 },
        timeout,
        () => now,
      ).deliver(payload, "notification", context),
    ).rejects.toMatchObject({ code: "RESEND_TIMEOUT", retryable: true });
  });

  it("requires operator reconciliation for old ambiguous attempts instead of risking a duplicate", async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ id: "email-123" })));
    const transport = new ResendLeadDeliveryTransport(config, send, () => now);
    const old = { attempts: 2, createdAt: new Date(now - 23 * 60 * 60 * 1000) };
    await expect(
      transport.deliver(payload, "notification", old),
    ).rejects.toMatchObject({
      code: "RESEND_RETRY_REQUIRES_REVIEW",
      retryable: false,
    });
    await expect(
      transport.deliver(payload, "notification"),
    ).rejects.toMatchObject({
      code: "RESEND_MISSING_ATTEMPT_CONTEXT",
      retryable: false,
    });
    await expect(
      transport.deliver(payload, "google_sheets", context),
    ).rejects.toMatchObject({
      code: "RESEND_WRONG_DESTINATION",
      retryable: false,
    });
    expect(send).not.toHaveBeenCalled();
    await transport.deliver(payload, "notification", { ...old, attempts: 1 });
    expect(send).toHaveBeenCalledOnce();
  });
});
