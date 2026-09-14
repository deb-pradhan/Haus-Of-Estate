import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  LEAD_FORM_VERSION,
  PRIVACY_NOTICE_VERSION,
  leadIntakeV2Schema,
  legacyLeadSchema,
  type LeadIntakeV2Input,
  type LegacyLeadInput,
} from "./contract";
import { LeadValidationError } from "./errors";

export type NormalizedLeadInterest =
  LeadIntakeV2Input["interest"] | "general_enquiry";

export interface NormalizedLeadIntake {
  submissionId: string;
  interest: NormalizedLeadInterest;
  preferences: {
    market?: string;
    location?: string;
    propertyType?: string;
    bedrooms?: string;
    bathrooms?: string;
    timeframe?: string;
  };
  project?: { slug: string };
  contact: {
    firstName: string;
    surname?: string;
    email: string;
    phone?: string;
    message?: string;
  };
  propertyMatchOptIn: boolean;
  newsletterOptIn: boolean;
  overseasCashBuyer: boolean;
  enquiryConsentGiven: boolean;
  formVersion: string;
  privacyNoticeVersion: string;
  context: {
    surface: string;
    pagePath: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  legacy: {
    intent?: string;
    buyOrRent?: string;
    useType?: string;
    area?: string;
    sellOrRent?: string;
    size?: string;
    viewType?: string;
    urgency?: string;
    budget?: string;
  };
}

function compact(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

function normalizePhone(value: string | undefined): string | undefined {
  const phone = compact(value);
  if (!phone) return undefined;

  const converted = phone.startsWith("00") ? `+${phone.slice(2)}` : phone;
  const normalized = converted.replace(/(?!^)\+|[^\d+]/g, "");
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    throw new LeadValidationError("Invalid phone number", {
      phone: ["Enter a valid phone number"],
    });
  }
  return normalized;
}

export function normalizePagePath(value: string): string {
  const raw = value.trim();
  try {
    const parsed = new URL(raw, "https://hausofestate.com");
    return parsed.pathname || "/";
  } catch {
    throw new LeadValidationError("Invalid page context", {
      pagePath: ["Enter a valid page path"],
    });
  }
}

export function normalizeReferrer(
  value: string | undefined,
): string | undefined {
  const referrer = compact(value);
  if (!referrer) return undefined;
  try {
    const parsed = new URL(referrer, "https://hausofestate.com");
    if (parsed.origin === "https://hausofestate.com") {
      return parsed.pathname || "/";
    }
    return `${parsed.origin}${parsed.pathname}`.slice(0, 500);
  } catch {
    return undefined;
  }
}

function fromV2(input: LeadIntakeV2Input): NormalizedLeadIntake {
  const preferences = input.preferences ?? {};
  return {
    submissionId: input.submissionId,
    interest: input.interest,
    preferences: {
      market: compact(preferences.market),
      location: compact(preferences.location),
      propertyType: compact(preferences.propertyType),
      bedrooms: compact(preferences.bedrooms),
      bathrooms: compact(preferences.bathrooms),
      timeframe: compact(preferences.timeframe),
    },
    project: input.project,
    contact: {
      firstName: compact(input.contact.firstName)!,
      email: input.contact.email.trim().toLowerCase(),
      phone: normalizePhone(input.contact.phone),
      message: compact(input.contact.message),
    },
    propertyMatchOptIn: input.propertyMatchOptIn,
    newsletterOptIn: input.newsletterOptIn,
    overseasCashBuyer: input.overseasCashBuyer,
    enquiryConsentGiven:
      input.formVersion === LEAD_FORM_VERSION
        ? input.privacyAcknowledged
        : false,
    formVersion: input.formVersion,
    privacyNoticeVersion: input.privacyNoticeVersion,
    context: {
      surface: input.context.surface,
      pagePath: normalizePagePath(input.context.pagePath),
      referrer: normalizeReferrer(input.context.referrer),
      utmSource: compact(input.context.utmSource),
      utmMedium: compact(input.context.utmMedium),
      utmCampaign: compact(input.context.utmCampaign),
      utmContent: compact(input.context.utmContent),
      utmTerm: compact(input.context.utmTerm),
    },
    legacy: {},
  };
}

function legacyInterest(input: LegacyLeadInput): NormalizedLeadInterest {
  if (input.intent === "seller") return "sell_let";
  if (input.intent === "invest" || input.useType === "investment")
    return "invest";
  if (input.intent === "buyer" && input.buyOrRent === "rent") return "rent";
  if (input.intent === "buyer") return "buy";
  return "general_enquiry";
}

function fromLegacy(input: LegacyLeadInput): NormalizedLeadIntake {
  return {
    submissionId: input.submissionId ?? randomUUID(),
    interest: legacyInterest(input),
    preferences: {
      market: compact(input.market),
      location: compact(input.location ?? input.area),
      propertyType: compact(input.propertyType),
      bedrooms: compact(input.bedrooms),
      bathrooms: compact(input.bathrooms),
      timeframe: compact(input.timeline ?? input.urgency),
    },
    contact: {
      firstName: compact(input.firstName)!,
      surname: compact(input.surname),
      email: input.email.trim().toLowerCase(),
      phone: normalizePhone(input.mobile),
    },
    propertyMatchOptIn: false,
    newsletterOptIn: false,
    overseasCashBuyer: false,
    enquiryConsentGiven: input.consentGiven,
    formVersion: "legacy.v1",
    privacyNoticeVersion: "legacy.enquiry-consent",
    context: {
      surface: "modal",
      pagePath: "/",
    },
    legacy: {
      intent: compact(input.intent),
      buyOrRent: compact(input.buyOrRent),
      useType: compact(input.useType),
      area: compact(input.area),
      sellOrRent: compact(input.sellOrRent),
      size: compact(input.size),
      viewType: compact(input.viewType),
      urgency: compact(input.urgency),
      budget: compact(input.budget),
    },
  };
}

function validationError(error: z.ZodError): LeadValidationError {
  const flattened = z.flattenError(error);
  return new LeadValidationError("Invalid submission", flattened.fieldErrors);
}

export function normalizeLeadRequest(body: unknown): NormalizedLeadIntake {
  const v2 = leadIntakeV2Schema.safeParse(body);
  if (v2.success) return fromV2(v2.data);

  const legacy = legacyLeadSchema.safeParse(body);
  if (legacy.success) return fromLegacy(legacy.data);

  const looksLikeV2 =
    typeof body === "object" &&
    body !== null &&
    ("submissionId" in body ||
      "contact" in body ||
      "interest" in body ||
      "formVersion" in body ||
      "context" in body);
  throw validationError(looksLikeV2 ? v2.error : legacy.error);
}

export function hashNormalizedLead(input: NormalizedLeadIntake): string {
  const canonical = {
    interest: input.interest,
    preferences: input.preferences,
    project: input.project,
    contact: input.contact,
    ...(input.formVersion === LEAD_FORM_VERSION ||
    input.formVersion === "2026-09-01.v3" ||
    input.formVersion === "2026-08-31.v2"
      ? { propertyMatchOptIn: input.propertyMatchOptIn }
      : {}),
    newsletterOptIn: input.newsletterOptIn,
    ...(input.formVersion === LEAD_FORM_VERSION ||
    input.formVersion === "2026-09-01.v3"
      ? { overseasCashBuyer: input.overseasCashBuyer }
      : {}),
    enquiryConsentGiven: input.enquiryConsentGiven,
    formVersion: input.formVersion,
    privacyNoticeVersion: input.privacyNoticeVersion,
    context: input.context,
    legacy: input.legacy,
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function currentContractVersions() {
  return {
    formVersion: LEAD_FORM_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
  } as const;
}
