import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { LEAD_FORM_VERSION, PRIVACY_NOTICE_VERSION } from "./contract";
import { LeadValidationError } from "./errors";
import {
  hashNormalizedLead,
  normalizeLeadRequest,
  normalizeReferrer,
} from "./normalize";

function v2(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
    interest: "buy",
    preferences: { market: "  Dubai ", bedrooms: "2" },
    contact: {
      firstName: "  Surya  ",
      email: " Surya@Example.COM ",
      phone: "",
    },
    privacyAcknowledged: true,
    overseasCashBuyer: false,
    propertyMatchOptIn: false,
    newsletterOptIn: false,
    formVersion: LEAD_FORM_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    context: {
      surface: "register_interest",
      pagePath: "/register-interest?utm_source=instagram",
      referrer: "https://example.com/path?email=private@example.com",
    },
    ...overrides,
  };
}

type NormalizedLead = ReturnType<typeof normalizeLeadRequest>;

function hashCanonical(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function hashInitialContractShape(input: NormalizedLead): string {
  return hashCanonical({
    interest: input.interest,
    preferences: input.preferences,
    project: input.project,
    contact: input.contact,
    newsletterOptIn: input.newsletterOptIn,
    enquiryConsentGiven: input.enquiryConsentGiven,
    formVersion: input.formVersion,
    privacyNoticeVersion: input.privacyNoticeVersion,
    context: input.context,
    legacy: input.legacy,
  });
}

function hashPropertyMatchContractShape(input: NormalizedLead): string {
  return hashCanonical({
    interest: input.interest,
    preferences: input.preferences,
    project: input.project,
    contact: input.contact,
    propertyMatchOptIn: input.propertyMatchOptIn,
    newsletterOptIn: input.newsletterOptIn,
    enquiryConsentGiven: input.enquiryConsentGiven,
    formVersion: input.formVersion,
    privacyNoticeVersion: input.privacyNoticeVersion,
    context: input.context,
    legacy: input.legacy,
  });
}

function hashQualifierContractShape(input: NormalizedLead): string {
  return hashCanonical({
    interest: input.interest,
    preferences: input.preferences,
    project: input.project,
    contact: input.contact,
    propertyMatchOptIn: input.propertyMatchOptIn,
    newsletterOptIn: input.newsletterOptIn,
    overseasCashBuyer: input.overseasCashBuyer,
    enquiryConsentGiven: input.enquiryConsentGiven,
    formVersion: input.formVersion,
    privacyNoticeVersion: input.privacyNoticeVersion,
    context: input.context,
    legacy: input.legacy,
  });
}

describe("normalizeLeadRequest", () => {
  it("accepts an optional blank phone and normalizes contact/context fields", () => {
    const result = normalizeLeadRequest(v2());

    expect(result.contact).toEqual({
      firstName: "Surya",
      email: "surya@example.com",
      phone: undefined,
      message: undefined,
    });
    expect(result.context.pagePath).toBe("/register-interest");
    expect(result.context.referrer).toBe("https://example.com/path");
    expect(result.overseasCashBuyer).toBe(false);
    expect(result.propertyMatchOptIn).toBe(false);
    expect(result.newsletterOptIn).toBe(false);
    expect(result.enquiryConsentGiven).toBe(true);
  });

  it("records newsletter choice independently from enquiry handling", () => {
    const result = normalizeLeadRequest(
      v2({ propertyMatchOptIn: true, newsletterOptIn: true }),
    );
    expect(result.propertyMatchOptIn).toBe(true);
    expect(result.newsletterOptIn).toBe(true);
    expect(result.enquiryConsentGiven).toBe(true);
  });

  it("normalizes the overseas cash-buyer qualifier independently from consent", () => {
    const result = normalizeLeadRequest(v2({ overseasCashBuyer: true }));

    expect(result.overseasCashBuyer).toBe(true);
    expect(result.propertyMatchOptIn).toBe(false);
    expect(result.newsletterOptIn).toBe(false);
    expect(result.enquiryConsentGiven).toBe(true);
  });

  it("normalizes a legacy buyer without treating consent as marketing opt-in", () => {
    const result = normalizeLeadRequest({
      intent: "buyer",
      buyOrRent: "rent",
      firstName: "Alex",
      email: "ALEX@example.com",
      mobile: "+44 7700 900123",
      consentGiven: true,
    });

    expect(result.interest).toBe("rent");
    expect(result.contact.phone).toBe("+447700900123");
    expect(result.enquiryConsentGiven).toBe(true);
    expect(result.overseasCashBuyer).toBe(false);
    expect(result.propertyMatchOptIn).toBe(false);
    expect(result.newsletterOptIn).toBe(false);
  });

  it("rejects invalid optional phone values when supplied", () => {
    expect(() =>
      normalizeLeadRequest(
        v2({
          contact: {
            firstName: "Alex",
            email: "alex@example.com",
            phone: "123",
          },
        }),
      ),
    ).toThrow(LeadValidationError);
  });

  it("uses the normalized payload, not the submission ID, for its hash", () => {
    const first = normalizeLeadRequest(v2());
    const second = normalizeLeadRequest(
      v2({ submissionId: "254cf874-d27b-4698-a610-ab02eb860389" }),
    );
    expect(hashNormalizedLead(first)).toBe(hashNormalizedLead(second));
  });

  it("includes each independent marketing choice in the idempotency hash", () => {
    const clear = normalizeLeadRequest(v2());
    const match = normalizeLeadRequest(v2({ propertyMatchOptIn: true }));
    const newsletter = normalizeLeadRequest(v2({ newsletterOptIn: true }));

    expect(hashNormalizedLead(match)).not.toBe(hashNormalizedLead(clear));
    expect(hashNormalizedLead(newsletter)).not.toBe(hashNormalizedLead(clear));
    expect(hashNormalizedLead(match)).not.toBe(hashNormalizedLead(newsletter));
  });

  it("includes the overseas cash-buyer qualifier in the idempotency hash", () => {
    const clear = normalizeLeadRequest(v2());
    const overseasCashBuyer = normalizeLeadRequest(
      v2({ overseasCashBuyer: true }),
    );

    expect(hashNormalizedLead(overseasCashBuyer)).not.toBe(
      hashNormalizedLead(clear),
    );
  });

  it("preserves the pre-qualifier idempotency hash for v1 and legacy leads", () => {
    const initial = normalizeLeadRequest(
      v2({
        formVersion: "2026-08-29.v1",
        privacyNoticeVersion: "2026-08-29",
      }),
    );
    const legacy = normalizeLeadRequest({
      intent: "buyer",
      buyOrRent: "buy",
      firstName: "Alex",
      email: "alex@example.com",
      mobile: "+44 7700 900123",
      consentGiven: true,
    });

    expect(hashNormalizedLead(initial)).toBe(hashInitialContractShape(initial));
    expect(hashNormalizedLead(legacy)).toBe(hashInitialContractShape(legacy));
  });

  it("preserves property-match state in the v2 idempotency hash shape", () => {
    const clear = normalizeLeadRequest(
      v2({
        formVersion: "2026-08-31.v2",
        privacyNoticeVersion: "2026-08-31",
      }),
    );
    const matched = normalizeLeadRequest(
      v2({
        propertyMatchOptIn: true,
        formVersion: "2026-08-31.v2",
        privacyNoticeVersion: "2026-08-31",
      }),
    );

    expect(hashNormalizedLead(clear)).toBe(
      hashPropertyMatchContractShape(clear),
    );
    expect(hashNormalizedLead(matched)).toBe(
      hashPropertyMatchContractShape(matched),
    );
    expect(hashNormalizedLead(matched)).not.toBe(hashNormalizedLead(clear));
  });

  it("preserves match and cash-buyer state in the v3 idempotency hash shape", () => {
    const previous = normalizeLeadRequest(
      v2({
        privacyAcknowledged: false,
        propertyMatchOptIn: true,
        overseasCashBuyer: true,
        formVersion: "2026-09-01.v3",
        privacyNoticeVersion: "2026-09-01",
      }),
    );

    expect(previous.enquiryConsentGiven).toBe(false);
    expect(hashNormalizedLead(previous)).toBe(
      hashQualifierContractShape(previous),
    );
  });
});

describe("normalizeReferrer", () => {
  it("removes query strings from same-site and external referrers", () => {
    expect(
      normalizeReferrer("https://hausofestate.com/properties/a?utm_source=x"),
    ).toBe("/properties/a");
    expect(normalizeReferrer("https://linkedin.com/feed/?trk=private")).toBe(
      "https://linkedin.com/feed/",
    );
  });
});
