import { afterEach, describe, expect, it, vi } from "vitest";
import type { ZeptoMailConfig } from "./config";
import { ZeptoMailLeadDeliveryTransport } from "./zeptomail";
import { buildLeadDeliveryPayload } from "./payload";

const config: ZeptoMailConfig = {
  apiUrl: "https://api.zeptomail.eu/v1.1/email",
  token: "test-secret-key",
  fromEmail: "noreply@hausofestate.com",
  toEmail: "info@hausofestate.com",
  timeoutMs: 100,
};
const payloadInput = {
  eventId: "event-1", leadId: "lead-1", submittedAt: "2026-09-14T10:00:00.000Z",
  firstName: "Alex", email: "alex@example.com", phone: "+447000000000",
  interest: "buy", propertyMatchOptIn: false, newsletterOptIn: false, overseasCashBuyer: false,
  message: "Please discuss this handover. <script>unsafe()</script>",
};
const payload = buildLeadDeliveryPayload(payloadInput);
const acknowledgement = {
  data: [{ code: "EM_104", message: "Email request received" }],
  message: "OK", request_id: "provider-request-1", object: "email",
};

afterEach(() => vi.useRealTimers());

describe("ZeptoMail operational delivery", () => {
  it("sends one plain-text team message with explicit routing and tracking disabled", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(acknowledgement, { status: 201 }));
    await new ZeptoMailLeadDeliveryTransport(config, fetchMock).deliver(payload);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe(config.apiUrl);
    expect(request.redirect).toBe("error");
    expect(request.headers.Authorization).toBe("Zoho-enczapikey test-secret-key");
    const body = JSON.parse(request.body);
    expect(body).toMatchObject({
      from: { address: config.fromEmail, name: "Haus of Estate" },
      to: [{ email_address: { address: config.toEmail } }],
      reply_to: [{ address: "alex@example.com" }],
      client_reference: "event-1", track_clicks: false, track_opens: false,
    });
    expect(body.textbody).toContain("Enquiry message: Please discuss this handover. <script>unsafe()</script>");
    expect(body.textbody).toContain("Newsletter opt-in: No");
    expect(body.textbody).toContain("Lead ID: lead-1");
    expect(body).not.toHaveProperty("htmlbody");
    expect(body).not.toHaveProperty("bcc");
  });

  it.each([400, 401, 403, 422, 429, 500, 503, 408])("classifies HTTP %s without including provider error content", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ error: "private data and secret" }, { status }));
    await expect(new ZeptoMailLeadDeliveryTransport(config, fetchMock).deliver(payload)).rejects.toMatchObject({
      code: `ZEPTOMAIL_HTTP_${status}`, message: `ZEPTOMAIL_HTTP_${status}`,
      retryable: status === 408 || status === 429 || status >= 500,
    });
  });

  it.each([
    {}, { ...acknowledgement, request_id: "" }, { ...acknowledgement, data: [] },
    { ...acknowledgement, object: "other" }, { ...acknowledgement, data: [{ code: "UNKNOWN" }] },
    { ...acknowledgement, error: { message: "secret" } },
  ])("rejects incomplete provider acceptance %j", async (body) => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(body));
    await expect(new ZeptoMailLeadDeliveryTransport(config, fetchMock).deliver(payload)).rejects.toMatchObject({ code: "ZEPTOMAIL_INVALID_ACK", retryable: true });
  });

  it("rejects an empty successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(new ZeptoMailLeadDeliveryTransport(config, fetchMock).deliver(payload)).rejects.toMatchObject({ code: "ZEPTOMAIL_INVALID_ACK" });
  });

  it("bounds the send request and discards network error details", async () => {
    const brokenFetch = vi.fn().mockRejectedValue(new Error("test-secret-key private contact"));
    await expect(new ZeptoMailLeadDeliveryTransport(config, brokenFetch).deliver(payload)).rejects.toMatchObject({ code: "ZEPTOMAIL_NETWORK", message: "ZEPTOMAIL_NETWORK", retryable: true });
    vi.useFakeTimers();
    const stalledFetch = vi.fn((_url: unknown, request?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      request?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const delivery = new ZeptoMailLeadDeliveryTransport(config, stalledFetch).deliver(payload);
    const assertion = expect(delivery).rejects.toMatchObject({ code: "ZEPTOMAIL_TIMEOUT", retryable: true });
    await vi.advanceTimersByTimeAsync(101);
    await assertion;
  });

  it("keeps a malformed legacy reply address out of mail headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(acknowledgement));
    await new ZeptoMailLeadDeliveryTransport(config, fetchMock).deliver({
      ...payload, row: { ...payload.row, email: "alex@example.com\r\nBcc: outsider@example.com" },
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty("reply_to");
  });

  it.each(["+alias@example.com", "-alias@example.com", "'+alias@example.com", "'-alias@example.com"])(
    "omits ambiguous Excel-escaped Reply-To instead of changing mailbox %s",
    async (email) => {
      const originalPayload = buildLeadDeliveryPayload({ ...payloadInput, email });
      const originalCell = originalPayload.row.email;
      const fetchMock = vi.fn().mockResolvedValue(Response.json(acknowledgement));
      await new ZeptoMailLeadDeliveryTransport(config, fetchMock).deliver(originalPayload);
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty("reply_to");
      expect(originalPayload.row.email).toBe(originalCell);
    },
  );

  it.each(["alex@example.com", "'alias@example.com", "o'neil@example.com"])(
    "preserves the unambiguous Reply-To mailbox %s",
    async (email) => {
      const fetchMock = vi.fn().mockResolvedValue(Response.json(acknowledgement));
      await new ZeptoMailLeadDeliveryTransport(config, fetchMock).deliver(buildLeadDeliveryPayload({ ...payloadInput, email }));
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).reply_to).toEqual([{ address: email }]);
    },
  );
});
