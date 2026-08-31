import { describe, expect, it } from "vitest";
import {
  LEAD_FORM_VERSION,
  PRIVACY_NOTICE_VERSION,
  leadIntakeV2Schema,
} from "./contract";

function request(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
    interest: "buy",
    contact: { firstName: "Alex", email: "alex@example.com" },
    propertyMatchOptIn: false,
    newsletterOptIn: false,
    formVersion: LEAD_FORM_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    context: { surface: "modal", pagePath: "/" },
    ...overrides,
  };
}

describe("lead intake v2 contract", () => {
  it("keeps ordinary enquiries valid with both marketing choices clear", () => {
    expect(leadIntakeV2Schema.safeParse(request()).success).toBe(true);
  });

  it("requires affirmative consent for newsletter-only registration", () => {
    const rejected = leadIntakeV2Schema.safeParse(
      request({ interest: "newsletter_only" }),
    );
    expect(rejected.success).toBe(false);
    if (!rejected.success) {
      expect(rejected.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["newsletterOptIn"] }),
        ]),
      );
    }
    expect(
      leadIntakeV2Schema.safeParse(
        request({ interest: "newsletter_only", newsletterOptIn: true }),
      ).success,
    ).toBe(true);
  });

  it("limits match consent to a current buyer, renter or investor brief", () => {
    expect(
      leadIntakeV2Schema.safeParse(request({ propertyMatchOptIn: true })).success,
    ).toBe(true);
    expect(
      leadIntakeV2Schema.safeParse(
        request({ interest: "sell_let", propertyMatchOptIn: true }),
      ).success,
    ).toBe(false);
  });

  it("accepts the previous paired form versions during a rolling deployment", () => {
    expect(
      leadIntakeV2Schema.safeParse(
        request({
          formVersion: "2026-08-29.v1",
          privacyNoticeVersion: "2026-08-29",
        }),
      ).success,
    ).toBe(true);
    expect(
      leadIntakeV2Schema.safeParse(
        request({ formVersion: "2026-08-29.v1" }),
      ).success,
    ).toBe(false);
  });
});
