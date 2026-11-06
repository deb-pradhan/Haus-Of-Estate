import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResendWebhookReceipt } from "@/lib/email/resend-webhook-store";

const mocks = vi.hoisted(() => ({ access: vi.fn(), createMany: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: new Proxy({}, {
    get(_target, property) {
      mocks.access(property);
      if (property === "resendWebhookEvent") return { createMany: mocks.createMany };
      throw new Error("Webhook must not access other database models");
    },
  }),
}));

// Keep the actual Resend SDK verifier: these tests exercise real HMAC signatures.
import { POST } from "./route";
import { RESEND_WEBHOOK_MAX_BYTES } from "@/lib/email/resend-webhook";

const secretBytes = Buffer.from("synthetic-webhook-test-secret-only");
const secret = `whsec_${secretBytes.toString("base64")}`;
const now = new Date("2026-10-22T12:00:00.000Z");
const messageId = "f1d0f273-3d9b-4843-9d39-c620db82c5b6";
const stored = new Map<string, ResendWebhookReceipt & { receivedAt: Date }>();

function event(type = "email.delivered", createdAt = "2026-10-22T11:59:50.000Z") {
  return {
    type,
    created_at: createdAt,
    data: {
      email_id: messageId,
      created_at: "2026-10-22T11:59:00.000Z",
      from: "sender@example.com",
      to: ["recipient@example.com"],
      subject: "Private subject",
      tags: { lead_id: "private-lead-id" },
      bounce: { message: "Private bounce detail", type: "Permanent", subType: "General" },
    },
  };
}

function signedRequest(
  payload = JSON.stringify(event()),
  options: { id?: string; timestamp?: number; headers?: Record<string, string>; key?: Buffer } = {},
) {
  const id = options.id ?? "msg_test_event";
  const timestamp = String(options.timestamp ?? Math.floor(now.getTime() / 1000));
  const signature = createHmac("sha256", options.key ?? secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  return new Request("https://staging.example.com/api/webhooks/resend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signature}`,
      ...options.headers,
    },
    body: payload,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  vi.stubEnv("RESEND_WEBHOOK_ENABLED", "true");
  vi.stubEnv("RESEND_WEBHOOK_SECRET", secret);
  vi.stubEnv("RESEND_API_KEY", "");
  // The database module is mocked; no connection is possible.
  vi.stubEnv("DATABASE_URL", "postgresql://synthetic:synthetic@database.invalid/test");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Webhook must not send network requests"); }));
  stored.clear();
  mocks.access.mockReset();
  mocks.createMany.mockReset();
  mocks.createMany.mockImplementation(async ({ data, skipDuplicates }: {
    data: ResendWebhookReceipt; skipDuplicates: boolean;
  }) => {
    expect(skipDuplicates).toBe(true);
    if (stored.has(data.svixId)) return { count: 0 };
    stored.set(data.svixId, { ...data, receivedAt: new Date() });
    return { count: 1 };
  });
});

afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("Resend webhook signatures and gating", () => {
  it.each([
    ["RESEND_WEBHOOK_ENABLED", "false"],
    ["RESEND_WEBHOOK_ENABLED", ""],
    ["RESEND_WEBHOOK_ENABLED", "TRUE"],
    ["RESEND_WEBHOOK_ENABLED", " true "],
    ["RESEND_WEBHOOK_SECRET", ""],
    ["RESEND_WEBHOOK_SECRET", "   "],
    ["DATABASE_URL", ""],
    ["DATABASE_URL", "   "],
  ])("fails closed before reading the body or database for %s=%j", async (name, value) => {
    vi.stubEnv(name, value);
    const request = signedRequest();
    const response = await POST(request);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(request.bodyUsed).toBe(false);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it("verifies original whitespace and Unicode without a sending API key", async () => {
    const payload = JSON.stringify({ ...event(), ignored: "原文" }, null, 2) + "\n";
    expect((await POST(signedRequest(payload))).status).toBe(200);
    expect(stored.size).toBe(1);
  });

  it.each(["svix-id", "svix-timestamp", "svix-signature"])("rejects a missing %s before database access", async (header) => {
    const request = signedRequest();
    request.headers.delete(header);
    expect((await POST(request)).status).toBe(401);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it.each(["body", "svix-id", "svix-timestamp", "svix-signature"])("rejects tampered %s before database access", async (field) => {
    let request = signedRequest();
    if (field === "body") {
      request = new Request(request.url, {
        method: "POST", headers: request.headers,
        body: JSON.stringify({ ...event(), type: "email.bounced" }),
      });
    } else if (field === "svix-timestamp") {
      request.headers.set(field, String(Math.floor(now.getTime() / 1000) - 1));
    } else {
      request.headers.set(field, "tampered");
    }
    expect((await POST(request)).status).toBe(401);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it.each([-301, 301])("rejects a valid signature outside timestamp tolerance (%i seconds)", async (offset) => {
    const request = signedRequest(undefined, { timestamp: Math.floor(now.getTime() / 1000) + offset });
    expect((await POST(request)).status).toBe(401);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it("rejects a signature made with another secret", async () => {
    expect((await POST(signedRequest(undefined, { key: Buffer.from("wrong-key") }))).status).toBe(401);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it.each(["not-a-timestamp", `${Math.floor(now.getTime() / 1000)}junk`])("rejects malformed timestamp %s", async (timestamp) => {
    expect((await POST(signedRequest(undefined, { headers: { "svix-timestamp": timestamp } }))).status).toBe(401);
    expect(mocks.access).not.toHaveBeenCalled();
  });
});

describe("bounded raw webhook bodies", () => {
  it("accepts a valid signed body exactly at the byte limit", async () => {
    const base = JSON.stringify(event());
    const payload = base + " ".repeat(RESEND_WEBHOOK_MAX_BYTES - Buffer.byteLength(base));
    expect((await POST(signedRequest(payload))).status).toBe(200);
    expect(stored.size).toBe(1);
  });

  it("rejects an oversized declared body without reading it", async () => {
    const request = signedRequest(undefined, {
      headers: { "content-length": String(RESEND_WEBHOOK_MAX_BYTES + 1) },
    });
    expect((await POST(request)).status).toBe(413);
    expect(request.bodyUsed).toBe(false);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it.each([undefined, "1"])("bounds actual UTF-8 bytes regardless of content-length %j", async (length) => {
    const payload = JSON.stringify({ ...event(), padding: "é".repeat(RESEND_WEBHOOK_MAX_BYTES / 2) });
    const request = signedRequest(payload, { headers: length ? { "content-length": length } : {} });
    expect((await POST(request)).status).toBe(413);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it("cancels a chunked stream once accumulated bytes exceed the limit", async () => {
    const cancel = vi.fn();
    let chunk = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(chunk++ === 0 ? RESEND_WEBHOOK_MAX_BYTES : 1));
      },
      cancel,
    });
    const request = new Request("https://staging.example.com/api/webhooks/resend", {
      method: "POST", headers: signedRequest().headers, body, duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect((await POST(request)).status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it("rejects invalid UTF-8 instead of verifying replacement characters", async () => {
    const request = new Request("https://staging.example.com/api/webhooks/resend", {
      method: "POST", headers: signedRequest().headers, body: Uint8Array.from([0xc3, 0x28]),
    });
    expect((await POST(request)).status).toBe(400);
    expect(mocks.access).not.toHaveBeenCalled();
  });
});

describe("append-only delivery evidence", () => {
  it.each([
    "email.sent", "email.delivered", "email.delivery_delayed", "email.bounced",
    "email.complained", "email.failed", "email.suppressed",
  ])("stores only the minimal receipt for %s", async (type) => {
    const response = await POST(signedRequest(JSON.stringify(event(type))));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mocks.createMany).toHaveBeenCalledExactlyOnceWith({
      data: {
        svixId: "msg_test_event", providerMessageId: messageId, eventType: type,
        occurredAt: new Date("2026-10-22T11:59:50.000Z"),
      },
      skipDuplicates: true,
    });
    expect(JSON.stringify([...stored.values()])).not.toMatch(/example\.com|Private|private-lead-id/);
  });

  it.each(["email.opened", "email.clicked", "contact.created", "email.future_event"])("authenticates but ignores %s without database access", async (type) => {
    const response = await POST(signedRequest(JSON.stringify(event(type))));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ignored: true });
    expect(mocks.access).not.toHaveBeenCalled();
    const unsigned = signedRequest(JSON.stringify(event(type)), { key: Buffer.from("wrong-key") });
    expect((await POST(unsigned)).status).toBe(401);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it.each([
    null,
    {},
    { ...event(), created_at: "not-a-date" },
    { ...event(), created_at: "2026-02-30T11:59:50.000Z" },
    { ...event(), data: {} },
    { ...event(), data: { email_id: "recipient@example.com" } },
    { ...event(), data: { email_id: "x".repeat(256) } },
  ])("rejects malformed signed event %# without database access", async (payload) => {
    expect((await POST(signedRequest(JSON.stringify(payload)))).status).toBe(400);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it("acknowledges concurrent duplicate deliveries without changing the original receipt", async () => {
    const responses = await Promise.all([POST(signedRequest()), POST(signedRequest())]);
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    expect(stored.size).toBe(1);
    const original = stored.get("msg_test_event");
    vi.setSystemTime(new Date(now.getTime() + 10_000));
    expect((await POST(signedRequest())).status).toBe(200);
    expect(stored.get("msg_test_event")).toEqual(original);
  });

  it("preserves early and out-of-order events without reading or updating the outbox", async () => {
    await POST(signedRequest(JSON.stringify(event("email.delivered")), { id: "msg_delivered_first" }));
    await POST(signedRequest(JSON.stringify(event("email.sent", "2026-10-22T11:59:00.000Z")), { id: "msg_sent_later" }));
    await POST(signedRequest(JSON.stringify(event("email.bounced", "2026-10-22T12:00:00.000Z")), { id: "msg_bounced" }));
    expect([...stored.values()].map(({ eventType }) => eventType)).toEqual(["email.delivered", "email.sent", "email.bounced"]);
    expect([...stored.values()].every(({ providerMessageId }) => providerMessageId === messageId)).toBe(true);
    expect(mocks.access.mock.calls.map(([property]) => property)).toEqual([
      "resendWebhookEvent", "resendWebhookEvent", "resendWebhookEvent",
    ]);
  });

  it("waits for persistence before acknowledging a handled event", async () => {
    let resolveInsert!: (result: { count: number }) => void;
    mocks.createMany.mockImplementation(() => new Promise((resolve) => { resolveInsert = resolve; }));
    let completed = false;
    const pending = POST(signedRequest()).then((response) => { completed = true; return response; });
    await vi.waitFor(() => expect(mocks.createMany).toHaveBeenCalledOnce());
    expect(completed).toBe(false);
    resolveInsert({ count: 1 });
    expect((await pending).status).toBe(200);
  });

  it("returns retryable 503 on database failure without exposing provider or recipient details", async () => {
    mocks.createMany.mockRejectedValue(new Error("database.invalid recipient@example.com secret credential"));
    const response = await POST(signedRequest());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Webhook persistence unavailable" });
    expect(stored.size).toBe(0);
  });
});
