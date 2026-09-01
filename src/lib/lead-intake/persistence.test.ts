import { describe, expect, it, vi } from "vitest";
import {
  LEAD_FORM_VERSION,
  MARKETING_CONSENT_WORDING,
  PRIVACY_NOTICE_VERSION,
  PROPERTY_MATCH_CONSENT_WORDING,
} from "./contract";
import { LeadConflictError, LeadRateLimitError } from "./errors";
import { hashNormalizedLead, normalizeLeadRequest } from "./normalize";
import {
  createPrismaLeadIntakeStore,
  type PersistLeadSubmission,
} from "./persistence";

function normalized(
  propertyMatchOptIn = false,
  newsletterOptIn = false,
  overseasCashBuyer = false,
) {
  return normalizeLeadRequest({
    submissionId: "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
    interest: "buy",
    preferences: {
      market: "Dubai",
      location: "Marina",
      propertyType: "Apartment",
      bedrooms: "2",
      bathrooms: "2",
      timeframe: "0-3 months",
    },
    contact: {
      firstName: "Alex",
      email: "alex@example.com",
    },
    overseasCashBuyer,
    propertyMatchOptIn,
    newsletterOptIn,
    formVersion: LEAD_FORM_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    context: { surface: "modal", pagePath: "/properties/example" },
  });
}

function submission(
  propertyMatchOptIn = false,
  newsletterOptIn = false,
  overseasCashBuyer = false,
): PersistLeadSubmission {
  const input = normalized(
    propertyMatchOptIn,
    newsletterOptIn,
    overseasCashBuyer,
  );
  return {
    input,
    payloadHash: hashNormalizedLead(input),
    ipHash: "hashed-address",
    leadId: "lead-id",
    outboxId: "outbox-id",
    submittedAt: new Date("2026-08-29T12:00:00.000Z"),
    scoring: { score: 30, tier: "nurture", routing: "luxury" },
  };
}

function database(overrides: Record<string, unknown> = {}) {
  const transaction = {
    $executeRaw: vi.fn(async () => 1),
    lead: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async (args: { data: { id: string } }) => ({
        id: args.data.id,
      })),
    },
    leadSubmissionThrottle: {
      count: vi.fn(async () => 0),
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    newsletterSubscription: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({
        id: "subscription-id",
        consentedAt: new Date("2026-08-29T12:00:00.000Z"),
        withdrawnAt: null,
      })),
      update: vi.fn(async () => ({
        id: "subscription-id",
        consentedAt: new Date("2026-08-29T12:00:00.000Z"),
        withdrawnAt: null,
      })),
    },
    newsletterConsentEvent: {
      create: vi.fn(async () => ({ id: "consent-event-id" })),
    },
    propertyMatchSubscription: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({
        id: "match-subscription-id",
        consentedAt: new Date("2026-08-29T12:00:00.000Z"),
        withdrawnAt: null,
      })),
      update: vi.fn(async () => ({
        id: "match-subscription-id",
        consentedAt: new Date("2026-08-29T12:00:00.000Z"),
        withdrawnAt: null,
      })),
    },
    propertyMatchConsentEvent: {
      create: vi.fn(async () => ({ id: "match-consent-event-id" })),
    },
    leadDeliveryOutbox: {
      create: vi.fn(async () => ({ id: "outbox-id" })),
    },
    ...overrides,
  };
  const client = {
    lead: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(
      async (callback: (value: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };
  return { client, transaction };
}

describe("Prisma lead intake transaction", () => {
  it("creates the lead, consent evidence, and delivery outbox together", async () => {
    const { client, transaction } = database();
    const store = createPrismaLeadIntakeStore(client as never);

    const result = await store.persistSubmission(submission(true, true, true));

    expect(result).toMatchObject({
      created: true,
      leadId: "lead-id",
      outboxId: "outbox-id",
    });
    expect(transaction.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "alex@example.com",
          phone: null,
          overseasCashBuyer: true,
          propertyMatchOptIn: true,
          newsletterOptIn: true,
        }),
      }),
    );
    expect(transaction.newsletterConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: "lead-id",
        type: "OPT_IN",
        wording: MARKETING_CONSENT_WORDING,
      }),
    });
    expect(transaction.propertyMatchConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: "lead-id",
        type: "OPT_IN",
        wording: PROPERTY_MATCH_CONSENT_WORDING,
      }),
    });
    expect(transaction.leadDeliveryOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "outbox-id",
        leadId: "lead-id",
        payload: expect.objectContaining({
          eventId: "outbox-id",
          leadId: "lead-id",
          row: expect.objectContaining({
            overseasCashBuyer: true,
            propertyMatchOptIn: true,
            newsletterOptIn: true,
            source: "modal",
            landingPage: "/properties/example",
          }),
        }),
      }),
    });
  });

  it("does not create newsletter state when the optional checkbox is clear", async () => {
    const { client, transaction } = database();
    const store = createPrismaLeadIntakeStore(client as never);
    await store.persistSubmission(submission(false, false));

    expect(transaction.newsletterSubscription.create).not.toHaveBeenCalled();
    expect(transaction.newsletterSubscription.update).not.toHaveBeenCalled();
    expect(transaction.newsletterConsentEvent.create).not.toHaveBeenCalled();
    expect(transaction.propertyMatchSubscription.create).not.toHaveBeenCalled();
    expect(transaction.propertyMatchSubscription.update).not.toHaveBeenCalled();
    expect(transaction.propertyMatchConsentEvent.create).not.toHaveBeenCalled();
    expect(transaction.leadDeliveryOutbox.create).toHaveBeenCalledOnce();
  });

  it("persists cash-buyer context without creating consent state", async () => {
    const { client, transaction } = database();
    const store = createPrismaLeadIntakeStore(client as never);
    await store.persistSubmission(submission(false, false, true));

    expect(transaction.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ overseasCashBuyer: true }),
      }),
    );
    expect(transaction.newsletterConsentEvent.create).not.toHaveBeenCalled();
    expect(transaction.propertyMatchConsentEvent.create).not.toHaveBeenCalled();
    expect(transaction.leadDeliveryOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        payload: expect.objectContaining({
          row: expect.objectContaining({ overseasCashBuyer: true }),
        }),
      }),
    });
  });

  it("records a stale opt-in event without overriding a newer withdrawal", async () => {
    const { client, transaction } = database();
    transaction.newsletterSubscription.findUnique.mockResolvedValue({
      id: "subscription-id",
      status: "WITHDRAWN",
      consentedAt: null,
      withdrawnAt: new Date("2026-08-29T13:00:00.000Z"),
    } as never);
    const store = createPrismaLeadIntakeStore(client as never);

    await store.persistSubmission(submission(false, true));

    expect(transaction.newsletterSubscription.update).not.toHaveBeenCalled();
    expect(transaction.newsletterConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: "subscription-id",
        type: "OPT_IN",
        createdAt: new Date("2026-08-29T12:00:00.000Z"),
      }),
    });
  });

  it("rejects the eleventh request before writing a lead", async () => {
    const { client, transaction } = database();
    transaction.leadSubmissionThrottle.count.mockResolvedValue(10);
    transaction.leadSubmissionThrottle.findFirst.mockResolvedValue({
      createdAt: new Date("2026-08-29T11:55:00.000Z"),
    } as never);
    const store = createPrismaLeadIntakeStore(client as never);

    await expect(store.persistSubmission(submission())).rejects.toBeInstanceOf(
      LeadRateLimitError,
    );
    expect(transaction.lead.create).not.toHaveBeenCalled();
    expect(transaction.leadDeliveryOutbox.create).not.toHaveBeenCalled();
  });

  it("does not enqueue delivery when database lead creation fails", async () => {
    const { client, transaction } = database();
    transaction.lead.create.mockRejectedValue(
      new Error("database unavailable"),
    );
    const store = createPrismaLeadIntakeStore(client as never);

    await expect(store.persistSubmission(submission())).rejects.toThrow(
      "database unavailable",
    );
    expect(transaction.leadDeliveryOutbox.create).not.toHaveBeenCalled();
  });

  it("returns identical replays and rejects conflicting payloads", async () => {
    const first = submission();
    const { client, transaction } = database();
    transaction.lead.findUnique.mockResolvedValue({
      id: "existing-lead",
      submissionId: first.input.submissionId,
      payloadHash: first.payloadHash,
      score: 30,
      tier: "nurture",
      deliveryOutbox: { id: "existing-outbox" },
    } as never);
    const store = createPrismaLeadIntakeStore(client as never);

    await expect(store.persistSubmission(first)).resolves.toMatchObject({
      created: false,
      leadId: "existing-lead",
    });
    expect(transaction.leadSubmissionThrottle.count).not.toHaveBeenCalled();

    await expect(
      store.persistSubmission({ ...first, payloadHash: "different" }),
    ).rejects.toBeInstanceOf(LeadConflictError);
  });
});
