import { z } from "zod";

export const LEAD_FORM_VERSION = "2026-08-31.v2";
export const PRIVACY_NOTICE_VERSION = "2026-08-31";
const PREVIOUS_LEAD_FORM_VERSION = "2026-08-29.v1";
const PREVIOUS_PRIVACY_NOTICE_VERSION = "2026-08-29";
export const MARKETING_CONSENT_WORDING =
  "Email me the Haus of Estate newsletter, including market reports, blog highlights and new developments. I can unsubscribe at any time.";
const PREVIOUS_MARKETING_CONSENT_WORDING =
  "I would like to receive property news, insights and offers from Haus of Estate by email. I can unsubscribe at any time.";
export const PROPERTY_MATCH_CONSENT_WORDING =
  "Email me properties and opportunities matching this brief. I can unsubscribe at any time.";

export const leadInterestSchema = z.enum([
  "buy",
  "rent",
  "invest",
  "sell_let",
  "newsletter_only",
]);

const optionalString = (max: number) => z.string().trim().max(max).optional();

export const leadIntakeV2Schema = z
  .object({
    submissionId: z.uuid(),
    interest: leadInterestSchema,
    preferences: z
      .object({
        market: optionalString(80),
        location: optionalString(160),
        propertyType: optionalString(80),
        bedrooms: optionalString(30),
        bathrooms: optionalString(30),
        timeframe: optionalString(80),
      })
      .strict()
      .optional(),
    project: z
      .object({
        slug: z
          .string()
          .trim()
          .min(1)
          .max(96)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      })
      .strict()
      .optional(),
    contact: z
      .object({
        firstName: z.string().trim().min(1).max(80),
        email: z.string().trim().toLowerCase().email().max(254),
        phone: optionalString(40),
        message: optionalString(2_000),
      })
      .strict(),
    propertyMatchOptIn: z.boolean().default(false),
    newsletterOptIn: z.boolean().default(false),
    formVersion: z.enum([LEAD_FORM_VERSION, PREVIOUS_LEAD_FORM_VERSION]),
    privacyNoticeVersion: z.enum([
      PRIVACY_NOTICE_VERSION,
      PREVIOUS_PRIVACY_NOTICE_VERSION,
    ]),
    context: z
      .object({
        surface: z.enum([
          "modal",
          "manual_cta",
          "newsletter",
          "register_interest",
        ]),
        pagePath: z.string().trim().min(1).max(500),
        referrer: optionalString(1_000),
        utmSource: optionalString(100),
        utmMedium: optionalString(100),
        utmCampaign: optionalString(150),
        utmContent: optionalString(150),
        utmTerm: optionalString(150),
      })
      .strict(),
    website: z.string().max(200).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    const hasCurrentVersion =
      input.formVersion === LEAD_FORM_VERSION &&
      input.privacyNoticeVersion === PRIVACY_NOTICE_VERSION;
    const hasPreviousVersion =
      input.formVersion === PREVIOUS_LEAD_FORM_VERSION &&
      input.privacyNoticeVersion === PREVIOUS_PRIVACY_NOTICE_VERSION;
    if (!hasCurrentVersion && !hasPreviousVersion) {
      context.addIssue({
        code: "custom",
        path: ["formVersion"],
        message: "Form and privacy notice versions must match.",
      });
    }

    if (input.interest === "newsletter_only" && !input.newsletterOptIn) {
      context.addIssue({
        code: "custom",
        path: ["newsletterOptIn"],
        message: "Confirm that you want to receive the newsletter.",
      });
    }

    if (
      input.propertyMatchOptIn &&
      !["buy", "rent", "invest"].includes(input.interest)
    ) {
      context.addIssue({
        code: "custom",
        path: ["propertyMatchOptIn"],
        message: "Property match alerts require a buyer, renter or investor brief.",
      });
    }
    if (input.propertyMatchOptIn && !hasCurrentVersion) {
      context.addIssue({
        code: "custom",
        path: ["propertyMatchOptIn"],
        message: "Property match alerts require the current consent notice.",
      });
    }
  });

export type LeadIntakeV2Input = z.infer<typeof leadIntakeV2Schema>;

export function newsletterConsentWordingFor(formVersion: string): string {
  return formVersion === PREVIOUS_LEAD_FORM_VERSION
    ? PREVIOUS_MARKETING_CONSENT_WORDING
    : MARKETING_CONSENT_WORDING;
}

export const legacyLeadSchema = z
  .object({
    submissionId: z.uuid().optional(),
    intent: z.string().trim().min(1).max(40),
    firstName: z.string().trim().min(1).max(80),
    surname: optionalString(80),
    email: z.string().trim().toLowerCase().email().max(254),
    mobile: z.string().trim().min(1).max(40),
    consentGiven: z.literal(true),
    buyOrRent: optionalString(40),
    useType: optionalString(40),
    bedrooms: optionalString(30),
    bathrooms: optionalString(30),
    area: optionalString(160),
    market: optionalString(80),
    sellOrRent: optionalString(40),
    propertyType: optionalString(80),
    location: optionalString(160),
    size: optionalString(80),
    viewType: optionalString(80),
    urgency: optionalString(80),
    budget: optionalString(80),
    timeline: optionalString(80),
  })
  .passthrough();

export type LegacyLeadInput = z.infer<typeof legacyLeadSchema>;
