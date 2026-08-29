import {
  LEAD_DELIVERY_EVENT_TYPE,
  LEAD_DELIVERY_SCHEMA_VERSION,
  type LeadDeliveryPayload,
  type LeadDeliveryPayloadInput,
} from "./types";

export const EXCEL_LEAD_TABLE_HEADINGS = [
  "submission time",
  "lead ID",
  "name",
  "email",
  "phone",
  "interest",
  "market",
  "location",
  "property type",
  "bedrooms",
  "bathrooms",
  "timeframe",
  "project",
  "newsletter opt-in",
  "source",
  "campaign",
  "landing page",
  "status",
  "owner",
  "notes",
] as const;

function excelSafeCell(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function optionalCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return excelSafeCell(String(value).trim());
}

function requiredCell(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Lead delivery payload requires ${field}`);
  }
  return excelSafeCell(normalized);
}

function isoDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error("Lead delivery payload requires a valid submission time");
  }
  return date.toISOString();
}

function landingPageCell(value: string | null | undefined): string {
  if (!value) return "";
  const withoutQuery = value.trim().split(/[?#]/, 1)[0];
  try {
    return excelSafeCell(new URL(withoutQuery).pathname);
  } catch {
    return excelSafeCell(withoutQuery);
  }
}

export function buildLeadDeliveryPayload(
  input: LeadDeliveryPayloadInput,
): LeadDeliveryPayload {
  const firstName = requiredCell(input.firstName, "firstName");
  const surname = optionalCell(input.surname);

  return {
    schemaVersion: LEAD_DELIVERY_SCHEMA_VERSION,
    eventId: requiredCell(input.eventId, "eventId"),
    eventType: LEAD_DELIVERY_EVENT_TYPE,
    leadId: requiredCell(input.leadId, "leadId"),
    row: {
      submissionTime: isoDate(input.submittedAt),
      leadId: requiredCell(input.leadId, "leadId"),
      name: [firstName, surname].filter(Boolean).join(" "),
      email: requiredCell(input.email, "email").toLowerCase(),
      phone: optionalCell(input.phone),
      interest: requiredCell(input.interest, "interest"),
      market: optionalCell(input.market),
      location: optionalCell(input.location),
      propertyType: optionalCell(input.propertyType),
      bedrooms: optionalCell(input.bedrooms),
      bathrooms: optionalCell(input.bathrooms),
      timeframe: optionalCell(input.timeframe),
      project: optionalCell(input.project),
      newsletterOptIn: input.newsletterOptIn,
      source: optionalCell(input.source),
      campaign: optionalCell(input.campaign),
      landingPage: landingPageCell(input.landingPage),
      status: "New",
      owner: "",
      notes: "",
    },
  };
}

export function isLeadDeliveryPayload(
  value: unknown,
): value is LeadDeliveryPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LeadDeliveryPayload>;
  const row = candidate.row as Partial<LeadDeliveryPayload["row"]> | undefined;
  if (!row) return false;
  const stringCells: Array<keyof LeadDeliveryPayload["row"]> = [
    "submissionTime",
    "leadId",
    "name",
    "email",
    "phone",
    "interest",
    "market",
    "location",
    "propertyType",
    "bedrooms",
    "bathrooms",
    "timeframe",
    "project",
    "source",
    "campaign",
    "landingPage",
    "status",
    "owner",
    "notes",
  ];

  return (
    candidate.schemaVersion === LEAD_DELIVERY_SCHEMA_VERSION &&
    candidate.eventType === LEAD_DELIVERY_EVENT_TYPE &&
    typeof candidate.eventId === "string" &&
    candidate.eventId.length > 0 &&
    typeof candidate.leadId === "string" &&
    candidate.leadId.length > 0 &&
    typeof row.newsletterOptIn === "boolean" &&
    row.status === "New" &&
    row.leadId === candidate.leadId &&
    stringCells.every((key) => typeof row[key] === "string")
  );
}
