import { describe, expect, it, vi } from "vitest";
import { LeadValidationError } from "./errors";
import {
  createPrismaPropertyMatchConsentStore,
  recordPropertyMatchWithdrawal,
  type PropertyMatchConsentStore,
} from "./property-match";

describe("recordPropertyMatchWithdrawal", () => {
  it("normalizes and appends explicit withdrawal evidence", async () => {
    const withdrawnAt = new Date("2026-08-31T14:00:00.000Z");
    const store: PropertyMatchConsentStore = {
      recordWithdrawal: vi.fn(async (input) => ({
        subscriptionId: "subscription-id",
        eventId: "event-id",
        withdrawnAt: input.withdrawnAt,
      })),
    };

    await recordPropertyMatchWithdrawal(
      {
        email: " PERSON@Example.COM ",
        wording: "Stop sending matching properties.",
        privacyNoticeVersion: "2026-08-31",
        pageContext: "/unsubscribe?token=secret",
        source: "email",
      },
      store,
      () => withdrawnAt,
    );

    expect(store.recordWithdrawal).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "person@example.com",
        pageContext: "/unsubscribe",
        withdrawnAt,
      }),
    );
  });

  it("rejects a withdrawal without displayed wording", async () => {
    const store: PropertyMatchConsentStore = { recordWithdrawal: vi.fn() };
    await expect(
      recordPropertyMatchWithdrawal(
        {
          email: "person@example.com",
          wording: "",
          privacyNoticeVersion: "2026-08-31",
          pageContext: "/unsubscribe",
        },
        store,
      ),
    ).rejects.toBeInstanceOf(LeadValidationError);
  });

  it("serializes changes without replacing a newer opt-in", async () => {
    const transaction = {
      $executeRaw: vi.fn(async () => 1),
      propertyMatchSubscription: {
        findUnique: vi.fn(async () => ({
          id: "subscription-id",
          status: "ACTIVE",
          consentedAt: new Date("2026-08-31T15:00:00.000Z"),
          withdrawnAt: null,
        })),
        create: vi.fn(),
        update: vi.fn(),
      },
      propertyMatchConsentEvent: {
        create: vi.fn(async () => ({ id: "withdrawal-event" })),
      },
    };
    const client = {
      $transaction: vi.fn(
        async (callback: (value: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const store = createPrismaPropertyMatchConsentStore(client as never);

    await store.recordWithdrawal({
      email: "person@example.com",
      wording: "Stop sending matching properties.",
      privacyNoticeVersion: "2026-08-31",
      formVersion: "unsubscribe.v1",
      pageContext: "/unsubscribe",
      withdrawnAt: new Date("2026-08-31T14:00:00.000Z"),
    });

    expect(transaction.$executeRaw).toHaveBeenCalledOnce();
    expect(transaction.propertyMatchSubscription.update).not.toHaveBeenCalled();
    expect(transaction.propertyMatchConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: "subscription-id",
        type: "WITHDRAWAL",
      }),
    });
    expect(client.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });
});
