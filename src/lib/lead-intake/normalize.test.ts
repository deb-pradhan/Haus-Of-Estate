import { describe, expect, it } from "vitest";
import {
  LEAD_FORM_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "./contract";
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
    expect(result.newsletterOptIn).toBe(false);
    expect(result.enquiryConsentGiven).toBe(false);
  });

  it("records newsletter choice independently from enquiry handling", () => {
    const result = normalizeLeadRequest(v2({ newsletterOptIn: true }));
    expect(result.newsletterOptIn).toBe(true);
    expect(result.enquiryConsentGiven).toBe(false);
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
