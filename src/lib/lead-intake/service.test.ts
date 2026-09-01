import { describe, expect, it, vi } from "vitest";
import { LEAD_FORM_VERSION, PRIVACY_NOTICE_VERSION } from "./contract";
import { LeadConflictError, LeadRateLimitError } from "./errors";
import {
  hashNormalizedLead,
  normalizeLeadRequest,
  type NormalizedLeadIntake,
} from "./normalize";
import type { LeadIntakeStore } from "./persistence";
import { scoreLead, submitLeadIntake } from "./service";

function input(
  submissionId = "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
): NormalizedLeadIntake {
  return normalizeLeadRequest({
    submissionId,
    interest: "buy",
    contact: { firstName: "Alex", email: "alex@example.com" },
    overseasCashBuyer: false,
    propertyMatchOptIn: false,
    newsletterOptIn: false,
    formVersion: LEAD_FORM_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    context: { surface: "modal", pagePath: "/" },
  });
}

function dependencies(store: LeadIntakeStore) {
  return {
    store,
    resolveProject: vi.fn(async () => undefined),
    now: () => new Date("2026-08-29T12:00:00.000Z"),
    randomId: vi
      .fn()
      .mockReturnValueOnce("lead-id")
      .mockReturnValueOnce("outbox-id"),
  };
}

describe("submitLeadIntake", () => {
  it("returns an identical idempotent replay without persisting again", async () => {
    const value = input();
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => ({
        id: "lead-existing",
        submissionId: value.submissionId,
        payloadHash: hashNormalizedLead(value),
        score: 30,
        tier: "nurture",
        deliveryOutbox: { id: "outbox-existing" },
      })),
      persistSubmission: vi.fn(),
    };

    const result = await submitLeadIntake(
      value,
      "ip-hash",
      dependencies(store),
    );
    expect(result.created).toBe(false);
    expect(result.leadId).toBe("lead-existing");
    expect(store.persistSubmission).not.toHaveBeenCalled();
  });

  it("rejects a reused submission ID with different content", async () => {
    const value = input();
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => ({
        id: "lead-existing",
        submissionId: value.submissionId,
        payloadHash: "different-hash",
        score: 30,
        tier: "nurture",
      })),
      persistSubmission: vi.fn(),
    };

    await expect(
      submitLeadIntake(value, "ip-hash", dependencies(store)),
    ).rejects.toBeInstanceOf(LeadConflictError);
  });

  it("creates separate enquiries that share an email", async () => {
    const store: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async (submission) => ({
        created: true,
        leadId: submission.leadId,
        submissionId: submission.input.submissionId,
        score: submission.scoring.score,
        tier: submission.scoring.tier,
        outboxId: submission.outboxId,
      })),
    };

    await submitLeadIntake(input(), "ip-hash", dependencies(store));
    await submitLeadIntake(
      input("254cf874-d27b-4698-a610-ab02eb860389"),
      "ip-hash",
      dependencies(store),
    );
    expect(store.persistSubmission).toHaveBeenCalledTimes(2);
  });

  it("propagates throttling and database failures without reporting success", async () => {
    const throttledStore: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async () => {
        throw new LeadRateLimitError(60);
      }),
    };
    await expect(
      submitLeadIntake(input(), "ip-hash", dependencies(throttledStore)),
    ).rejects.toBeInstanceOf(LeadRateLimitError);

    const failedStore: LeadIntakeStore = {
      findSubmission: vi.fn(async () => null),
      persistSubmission: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
    };
    await expect(
      submitLeadIntake(input(), "ip-hash", dependencies(failedStore)),
    ).rejects.toThrow("database unavailable");
  });
});

describe("scoreLead", () => {
  it("preserves legacy scoring and routing when compatibility payloads migrate", () => {
    const legacy = normalizeLeadRequest({
      intent: "buyer",
      buyOrRent: "buy",
      useType: "investment",
      market: "dubai",
      area: "palm",
      firstName: "Alex",
      email: "alex@example.com",
      mobile: "+447700900123",
      consentGiven: true,
    });
    expect(scoreLead(legacy)).toEqual({
      score: 45,
      tier: "warm",
      routing: "luxury",
    });
  });
});
