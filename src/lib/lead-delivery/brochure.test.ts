import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBrochureDownloadUrl, verifyBrochureDownloadToken } from "@/lib/brochures/links";
import { BrochureStorageError, BrochureUnavailableError } from "@/lib/brochures/catalog";
import { renderBrochureEmail } from "@/lib/email/brochure";
import { ResendBrochureDeliveryTransport, isBrochureEmailReady } from "./brochure";
import { buildLeadDeliveryPayload, normalizeLeadDeliveryPayload } from "./payload";
import { enabledLeadDeliveryDestinations } from "./runtime";
import type { BrochureDeliverySelection } from "./types";

const mocks = vi.hoisted(() => ({ approved: vi.fn() }));
vi.mock("@/lib/brochures/catalog", async (original) => ({
  ...await original<typeof import("@/lib/brochures/catalog")>(),
  getApprovedBrochure: mocks.approved,
}));
const createdAt = new Date("2026-10-20T12:00:00Z");
const selection: BrochureDeliverySelection = {
  key: "villa-4br", revision: "a".repeat(64),
  projectSlug: "azizi-florence-4-bedroom-villas", projectTitle: "Azizi Florence — 4-Bedroom Villas",
  designId: "villa-4br-type-a", designLabel: "Villa Type A",
  recipientName: "<Buyer & Co>", recipientEmail: "+buyer@example.test",
};
const environment = {
  NODE_ENV: "test", BROCHURE_EMAIL_ENABLED: "true", LEAD_DELIVERY_ENABLED: "true",
  RESEND_API_KEY: "test-not-a-real-key", RESEND_FROM_EMAIL: "noreply@hausofestate.com",
  BROCHURE_REPLY_TO: "info@hausofestate.com", BROCHURE_LINK_SECRET: "test-only-secret-that-is-longer-than-32",
  BROCHURE_PUBLIC_ORIGIN: "https://hausofestate.com",
  BROCHURE_FILES_ROOT: "/private/brochures", BROCHURE_CATALOG_PATH: "/private/catalog.json",
};
const payload = buildLeadDeliveryPayload({
  eventId: "test-event-brochure", leadId: "test-lead", submittedAt: createdAt,
  firstName: selection.recipientName, email: selection.recipientEmail, interest: "buy",
  newsletterOptIn: false, propertyMatchOptIn: false, overseasCashBuyer: false, brochure: selection,
});
function setup(status = 200, acknowledgement: unknown = { id: "provider-receipt-1" }) {
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify(acknowledgement), { status }));
  return { fetchMock, transport: new ResendBrochureDeliveryTransport(environment, fetchMock, () => createdAt.getTime() + 1_000) };
}
beforeEach(() => { mocks.approved.mockReset().mockResolvedValue({ filename: "villa-4br.pdf" }); });

describe("customer brochure fulfilment", () => {
  it("sends the raw recipient, selected collection and private signed link without marketing enrolment", async () => {
    const { fetchMock, transport } = setup();
    await expect(transport.deliver(payload, "customer_brochure", { attempts: 1, createdAt }))
      .resolves.toEqual({ provider: "resend", providerMessageId: "provider-receipt-1" });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request?.redirect).toBe("error");
    const email = JSON.parse(String(request?.body));
    expect(email.to).toEqual(["+buyer@example.test"]);
    expect(email.reply_to).toBe("info@hausofestate.com");
    expect(email.attachments).toBeUndefined();
    expect(email.subject).toContain(selection.projectTitle);
    expect(email.html).toContain("&lt;Buyer &amp; Co&gt;");
    expect(email.html).not.toContain("<Buyer");
    expect(email.text).toContain("does not subscribe you");
    expect(email.text).toContain("Villa Type A");
    expect(email.text).not.toContain("/private/");
    const link = createBrochureDownloadUrl(selection, payload.eventId, createdAt, environment);
    expect(email.text).toContain(link);
    expect(verifyBrochureDownloadToken(new URL(link).pathname.split("/").at(-1)!, environment, createdAt))
      .toMatchObject({ key: selection.key, revision: selection.revision, projectSlug: selection.projectSlug });
    expect(mocks.approved).toHaveBeenCalledWith(selection.key, selection.revision, selection.projectSlug, environment);
  });

  it("reuses exactly the same email and idempotency key on retry", async () => {
    const { transport, fetchMock } = setup();
    await transport.deliver(payload, "customer_brochure", { attempts: 1, createdAt });
    await transport.deliver(payload, "customer_brochure", { attempts: 2, createdAt });
    expect(fetchMock.mock.calls[0][1]?.body).toBe(fetchMock.mock.calls[1][1]?.body);
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual(fetchMock.mock.calls[1][1]?.headers);
  });

  it.each([
    [429, { message: "rate limit" }, true],
    [503, { message: "unavailable" }, true],
    [409, { name: "concurrent_idempotent_requests" }, true],
    [409, { name: "invalid_idempotent_request" }, false],
    [403, { message: "domain not verified" }, false],
    [200, {}, true],
  ])("classifies provider status %s without leaking its response", async (status, ack, retryable) => {
    const { transport } = setup(status, ack);
    await expect(transport.deliver(payload, "customer_brochure", { attempts: 1, createdAt })).rejects.toMatchObject({ retryable });
  });

  it("holds ambiguous retries beyond Resend's retention window for manual review", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const transport = new ResendBrochureDeliveryTransport(environment, fetchMock, () => createdAt.getTime() + 23 * 3_600_000);
    await expect(transport.deliver(payload, "customer_brochure", { attempts: 2, createdAt }))
      .rejects.toMatchObject({ code: "BROCHURE_RETRY_REQUIRES_REVIEW", retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechecks approval and never emails a withdrawn brochure", async () => {
    mocks.approved.mockRejectedValue(new Error("sensitive filesystem path"));
    const { transport, fetchMock } = setup();
    await expect(transport.deliver(payload, "customer_brochure", { attempts: 1, createdAt }))
      .rejects.toMatchObject({ message: "BROCHURE_NOT_APPROVED", retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries classified storage outages without sending and keeps invalid brochures permanent", async () => {
    const { transport, fetchMock } = setup();
    mocks.approved.mockRejectedValueOnce(new BrochureStorageError());
    await expect(transport.deliver(payload, "customer_brochure", { attempts: 1, createdAt }))
      .rejects.toMatchObject({ code: "BROCHURE_STORAGE_UNAVAILABLE", retryable: true });
    mocks.approved.mockRejectedValueOnce(new BrochureUnavailableError());
    await expect(transport.deliver(payload, "customer_brochure", { attempts: 1, createdAt }))
      .rejects.toMatchObject({ code: "BROCHURE_NOT_APPROVED", retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a usable link at the clock-skew boundary and rejects greater future skew", async () => {
    const { fetchMock } = setup();
    const now = createdAt.getTime() - 60_000;
    const transport = new ResendBrochureDeliveryTransport(environment, fetchMock, () => now);
    await transport.deliver(payload, "customer_brochure", { attempts: 1, createdAt });
    const signed = createBrochureDownloadUrl(selection, payload.eventId, createdAt, environment);
    expect(verifyBrochureDownloadToken(new URL(signed).pathname.split("/").at(-1)!, environment, new Date(now)))
      .toMatchObject({ key: selection.key });
    fetchMock.mockClear();
    const futureTransport = new ResendBrochureDeliveryTransport(environment, fetchMock, () => now - 1);
    await expect(futureTransport.deliver(payload, "customer_brochure", { attempts: 1, createdAt }))
      .rejects.toMatchObject({ code: "BROCHURE_RETRY_REQUIRES_REVIEW", retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects missing context, wrong destinations and malformed immutable payloads", async () => {
    const { transport, fetchMock } = setup();
    await expect(transport.deliver(payload, "notification", { attempts: 1, createdAt })).rejects.toMatchObject({ retryable: false });
    await expect(transport.deliver(payload, "customer_brochure")).rejects.toMatchObject({ retryable: false });
    expect(normalizeLeadDeliveryPayload({ ...payload, brochure: { ...selection, recipientEmail: "invalid" } })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps customer email, staff notification and Sheets enablement independent and off by default", () => {
    expect(isBrochureEmailReady({})).toBe(false);
    expect(enabledLeadDeliveryDestinations({})).toEqual([]);
    expect(enabledLeadDeliveryDestinations({ BROCHURE_EMAIL_ENABLED: "true" })).toEqual(["customer_brochure"]);
    expect(enabledLeadDeliveryDestinations({ LEAD_NOTIFICATIONS_ENABLED: "true", LEAD_SHEETS_ENABLED: "true" })).toEqual(["notification", "google_sheets"]);
    expect(isBrochureEmailReady(environment)).toBe(true);
    expect(isBrochureEmailReady({ ...environment, BROCHURE_REPLY_TO: "" })).toBe(false);
    expect(isBrochureEmailReady({ ...environment, NODE_ENV: "production", BROCHURE_PUBLIC_ORIGIN: "https://localhost" })).toBe(false);
  });

  it("escapes every interpolated HTML field and removes subject line breaks", () => {
    const email = renderBrochureEmail({ ...selection, projectTitle: "Home\r\nBcc: test", designLabel: "<script>alert(1)</script>" }, "https://hausofestate.com/api/brochures/test");
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
