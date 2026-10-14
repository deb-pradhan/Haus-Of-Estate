import { describe, expect, it, vi } from "vitest";
import { LeadValidationError } from "./errors";
import {
  createPrismaNewsletterConsentStore,
  recordNewsletterWithdrawal,
  type NewsletterConsentStore,
} from "./newsletter";

describe("recordNewsletterWithdrawal", () => {
  it("normalizes and appends explicit withdrawal evidence", async () => {
    const withdrawnAt = new Date("2026-08-29T14:00:00.000Z");
    const store: NewsletterConsentStore = {
      recordWithdrawal: vi.fn(async (input) => ({
        subscriptionId: "subscription-id",
        eventId: "event-id",
        withdrawnAt: input.withdrawnAt,
      })),
    };

    const result = await recordNewsletterWithdrawal(
      {
        email: " PERSON@Example.COM ",
        wording: "Stop sending me marketing email.",
        privacyNoticeVersion: "2026-08-29",
        pageContext: "/unsubscribe?token=secret",
        source: "email",
      },
      store,
      () => withdrawnAt,
    );

    expect(result.eventId).toBe("event-id");
    expect(store.recordWithdrawal).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "person@example.com",
        pageContext: "/unsubscribe",
        withdrawnAt,
      }),
    );
  });

  it("rejects withdrawal requests without the displayed wording", async () => {
    const store: NewsletterConsentStore = {
      recordWithdrawal: vi.fn(),
    };
    await expect(
      recordNewsletterWithdrawal(
        {
          email: "person@example.com",
          wording: "",
          privacyNoticeVersion: "2026-08-29",
          pageContext: "/unsubscribe",
        },
        store,
      ),
    ).rejects.toBeInstanceOf(LeadValidationError);
  });

  it("serializes consent changes and preserves a newer opt-in state", async () => {
    const transaction = {
      $executeRaw: vi.fn(async () => 1),
      newsletterSubscription: {
        findUnique: vi.fn(async () => ({
          id: "subscription-id",
          status: "ACTIVE",
          consentedAt: new Date("2026-08-29T15:00:00.000Z"),
          withdrawnAt: null,
        })),
        create: vi.fn(),
        update: vi.fn(),
      },
      newsletterConsentEvent: {
        create: vi.fn(async () => ({ id: "withdrawal-event" })),
      },
    };
    const client = {
      $transaction: vi.fn(
        async (callback: (value: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const store = createPrismaNewsletterConsentStore(client as never);

    await store.recordWithdrawal({
      email: "person@example.com",
      wording: "Stop sending me marketing email.",
      privacyNoticeVersion: "2026-08-29",
      formVersion: "unsubscribe.v1",
      pageContext: "/unsubscribe",
      withdrawnAt: new Date("2026-08-29T14:00:00.000Z"),
    });

    expect(transaction.$executeRaw).toHaveBeenCalledOnce();
    expect(transaction.newsletterSubscription.update).not.toHaveBeenCalled();
    expect(transaction.newsletterConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: "subscription-id",
        type: "WITHDRAWAL",
      }),
    });
    expect(client.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: "Serializable" },
    );
  });
});
