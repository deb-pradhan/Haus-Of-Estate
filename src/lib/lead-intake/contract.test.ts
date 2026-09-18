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

describe("lead intake v2 contract", () => {
  it("accepts a general question without opting into marketing", () => {
    const result = leadIntakeV2Schema.parse(request({
      interest: "general_enquiry",
      contact: {
        firstName: "Alex",
        email: "alex@example.com",
        message: "  What services do you offer?  ",
      },
      context: { surface: "query_page", pagePath: "/enquire" },
    }));

    expect(result.contact.message).toBe("What services do you offer?");
    expect(result.newsletterOptIn).toBe(false);
    expect(result.propertyMatchOptIn).toBe(false);
    expect(result.overseasCashBuyer).toBe(false);
  });

  it.each(["general_enquiry", "buy", "rent", "invest", "sell_let"])(
    "requires a question for %s on the query page",
    (interest) => {
      for (const message of [undefined, "", " \n\t "]) {
        const result = leadIntakeV2Schema.safeParse(request({
          interest,
          contact: { firstName: "Alex", email: "alex@example.com", message },
          context: { surface: "query_page", pagePath: "/enquire" },
        }));
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toEqual(expect.arrayContaining([
            expect.objectContaining({ path: ["contact", "message"] }),
          ]));
        }
      }
    },
  );

  it("keeps the question length limit and excludes newsletter-only query submissions", () => {
    const base = request({
      interest: "general_enquiry",
      contact: { firstName: "Alex", email: "alex@example.com", message: "a".repeat(2_000) },
      context: { surface: "query_page", pagePath: "/enquire" },
    });
    expect(leadIntakeV2Schema.safeParse(base).success).toBe(true);
    expect(leadIntakeV2Schema.safeParse({
      ...base,
      contact: { ...base.contact, message: "a".repeat(2_001) },
    }).success).toBe(false);
    expect(leadIntakeV2Schema.safeParse({
      ...base,
      interest: "newsletter_only",
      newsletterOptIn: true,
    }).success).toBe(false);
  });

  it.each(["propertyMatchOptIn", "overseasCashBuyer"])(
    "rejects %s on a general enquiry",
    (field) => {
      const result = leadIntakeV2Schema.safeParse(request({
        interest: "general_enquiry",
        contact: { firstName: "Alex", email: "alex@example.com", message: "Please explain your services." },
        [field]: true,
      }));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(expect.arrayContaining([
          expect.objectContaining({ path: [field] }),
        ]));
      }
    },
  );

  it("keeps ordinary enquiries valid with both marketing choices clear", () => {
    const result = leadIntakeV2Schema.safeParse(request());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.overseasCashBuyer).toBe(false);
    }
  });

  it("requires the privacy acknowledgement only for the current form pair", () => {
    expect(
      leadIntakeV2Schema.safeParse(request({ privacyAcknowledged: false }))
        .success,
    ).toBe(false);
    expect(
      leadIntakeV2Schema.safeParse(
        request({
          privacyAcknowledged: false,
          formVersion: "2026-09-01.v3",
          privacyNoticeVersion: "2026-09-01",
        }),
      ).success,
    ).toBe(true);
  });

  it("defaults an omitted overseas cash-buyer qualifier to false", () => {
    const input: Record<string, unknown> = request();
    delete input.overseasCashBuyer;
    const result = leadIntakeV2Schema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.overseasCashBuyer).toBe(false);
    }
  });

  it("accepts the optional overseas cash-buyer qualifier without treating it as consent", () => {
    const result = leadIntakeV2Schema.safeParse(
      request({ overseasCashBuyer: true }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.overseasCashBuyer).toBe(true);
      expect(result.data.propertyMatchOptIn).toBe(false);
      expect(result.data.newsletterOptIn).toBe(false);
    }
  });

  it.each(["rent", "sell_let", "newsletter_only"])(
    "rejects the overseas cash-buyer qualifier for a %s enquiry",
    (interest) => {
      const result = leadIntakeV2Schema.safeParse(
        request({ interest, overseasCashBuyer: true }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ["overseasCashBuyer"] }),
          ]),
        );
      }
    },
  );

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
      leadIntakeV2Schema.safeParse(request({ propertyMatchOptIn: true }))
        .success,
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
          privacyAcknowledged: false,
          formVersion: "2026-09-01.v3",
          privacyNoticeVersion: "2026-09-01",
        }),
      ).success,
    ).toBe(true);
    expect(
      leadIntakeV2Schema.safeParse(
        request({
          privacyAcknowledged: false,
          formVersion: "2026-08-31.v2",
          privacyNoticeVersion: "2026-08-31",
        }),
      ).success,
    ).toBe(true);
    expect(
      leadIntakeV2Schema.safeParse(
        request({
          privacyAcknowledged: false,
          formVersion: "2026-08-29.v1",
          privacyNoticeVersion: "2026-08-29",
        }),
      ).success,
    ).toBe(true);
    expect(
      leadIntakeV2Schema.safeParse(request({ formVersion: "2026-08-29.v1" }))
        .success,
    ).toBe(false);
    expect(
      leadIntakeV2Schema.safeParse(
        request({
          privacyAcknowledged: false,
          overseasCashBuyer: true,
          formVersion: "2026-08-31.v2",
          privacyNoticeVersion: "2026-08-31",
        }),
      ).success,
    ).toBe(false);
  });
});
