import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEAD_FORM_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/lead-intake/contract";
import {
  LeadConflictError,
  LeadInfrastructureError,
  LeadRateLimitError,
} from "@/lib/lead-intake/errors";

const mocks = vi.hoisted(() => ({
  attemptImmediateLeadDelivery: vi.fn(),
  notifyLegacyLead: vi.fn(),
  submitLeadIntake: vi.fn(),
}));

vi.mock("@/lib/lead-delivery", () => ({
  attemptImmediateLeadDelivery: mocks.attemptImmediateLeadDelivery,
}));
vi.mock("@/lib/lead-intake/legacy", () => ({
  notifyLegacyLead: mocks.notifyLegacyLead,
}));
vi.mock("@/lib/lead-intake/service", () => ({
  submitLeadIntake: mocks.submitLeadIntake,
}));

import { POST } from "./route";

function v2(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
    interest: "buy",
    contact: { firstName: "Alex", email: "alex@example.com" },
    privacyAcknowledged: true,
    overseasCashBuyer: false,
    propertyMatchOptIn: false,
    newsletterOptIn: false,
    formVersion: LEAD_FORM_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    context: { surface: "modal", pagePath: "/" },
    ...overrides,
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.9",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("LEAD_INTAKE_ENABLED", "true");
  mocks.attemptImmediateLeadDelivery.mockResolvedValue("disabled");
  mocks.notifyLegacyLead.mockResolvedValue(undefined);
  mocks.submitLeadIntake.mockResolvedValue({
    created: true,
    leadId: "lead-id",
    submissionId: "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
    score: 30,
    tier: "nurture",
    outboxId: "outbox-id",
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("POST /api/leads", () => {
  it("returns 201 only after a new submission is persisted", async () => {
    const response = await POST(request(v2()));
    expect(response.status).toBe(201);
    expect(mocks.submitLeadIntake).toHaveBeenCalledOnce();
    expect(mocks.attemptImmediateLeadDelivery).toHaveBeenCalledWith(
      "outbox-id",
    );
  });

  it("requires the current privacy acknowledgement", async () => {
    const response = await POST(request(v2({ privacyAcknowledged: false })));
    expect(response.status).toBe(400);
    expect(mocks.submitLeadIntake).not.toHaveBeenCalled();
  });

  it("returns 200 for an identical idempotent replay", async () => {
    mocks.submitLeadIntake.mockResolvedValueOnce({
      created: false,
      leadId: "lead-id",
      submissionId: "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
      score: 30,
      tier: "nurture",
      outboxId: "outbox-id",
    });
    const response = await POST(request(v2()));
    expect(response.status).toBe(200);
    expect(mocks.attemptImmediateLeadDelivery).not.toHaveBeenCalled();
  });

  it("requires an explicit newsletter choice for newsletter-only requests", async () => {
    const rejected = await POST(request(v2({ interest: "newsletter_only" })));
    expect(rejected.status).toBe(400);
    expect(mocks.submitLeadIntake).not.toHaveBeenCalled();

    const accepted = await POST(
      request(v2({ interest: "newsletter_only", newsletterOptIn: true })),
    );
    expect(accepted.status).toBe(201);
    expect(mocks.submitLeadIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        interest: "newsletter_only",
        overseasCashBuyer: false,
        propertyMatchOptIn: false,
        newsletterOptIn: true,
      }),
      expect.any(String),
    );
  });

  it("passes the optional overseas cash-buyer qualifier to persistence", async () => {
    const response = await POST(request(v2({ overseasCashBuyer: true })));

    expect(response.status).toBe(201);
    expect(mocks.submitLeadIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        overseasCashBuyer: true,
        propertyMatchOptIn: false,
        newsletterOptIn: false,
      }),
      expect.any(String),
    );
  });

  it("keeps legacy submissions working while v2 is disabled", async () => {
    vi.stubEnv("LEAD_INTAKE_ENABLED", "false");
    const legacyResponse = await POST(
      request({
        intent: "buyer",
        firstName: "Alex",
        email: "alex@example.com",
        mobile: "+447700900123",
        consentGiven: true,
      }),
    );
    expect(legacyResponse.status).toBe(201);
    expect(mocks.submitLeadIntake).toHaveBeenCalledOnce();
    expect(mocks.notifyLegacyLead).toHaveBeenCalledOnce();

    const v2Response = await POST(request(v2()));
    expect(v2Response.status).toBe(503);
    expect(mocks.submitLeadIntake).toHaveBeenCalledOnce();
  });

  it("applies production origin checks to the legacy compatibility path", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LEAD_INTAKE_ENABLED", "false");

    const response = await POST(
      request({
        intent: "buyer",
        firstName: "Alex",
        email: "alex@example.com",
        mobile: "+447700900123",
        consentGiven: true,
      }),
    );

    expect(response.status).toBe(403);
    expect(mocks.submitLeadIntake).not.toHaveBeenCalled();
  });

  it("rejects validation, honeypot, and oversized chunked-style bodies", async () => {
    expect((await POST(request({ invalid: true }))).status).toBe(400);
    expect((await POST(request(v2({ website: "spam" })))).status).toBe(400);

    const oversized = request(v2({ padding: "x".repeat(70_000) }));
    oversized.headers.delete("content-length");
    expect((await POST(oversized)).status).toBe(400);
    expect(mocks.submitLeadIntake).not.toHaveBeenCalled();
  });

  it.each([
    [new LeadConflictError(), 409],
    [new LeadRateLimitError(60), 429],
    [new LeadInfrastructureError(), 503],
  ])(
    "maps expected service errors without leaking details",
    async (error, status) => {
      mocks.submitLeadIntake.mockRejectedValueOnce(error);
      const response = await POST(request(v2()));
      expect(response.status).toBe(status);
    },
  );
});
