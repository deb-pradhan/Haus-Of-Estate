import "server-only";
import { isIP } from "node:net";
import {
  ALL_UNIT_TYPES,
  buildPropertiesHref,
  isAvailability,
  isCategory,
  isIntent,
} from "@/lib/property-taxonomy";
import { client } from "@/sanity";
import {
  assistantKnowledgeSearchInputSchema,
  assistantKnowledgeSearchResultSchema,
  assistantPropertyLookupInputSchema,
  assistantPropertyLookupResultSchema,
  assistantPropertySearchInputSchema,
  assistantPropertySearchResultSchema,
  MAX_ASSISTANT_KNOWLEDGE_RESULTS,
  MAX_ASSISTANT_PROPERTY_RESULTS,
  type AssistantKnowledgeResult,
  type AssistantKnowledgeSearchInput,
  type AssistantKnowledgeSearchResult,
  type AssistantPropertyCard,
  type AssistantPropertyDetail,
  type AssistantPropertyLookupInput,
  type AssistantPropertyLookupResult,
  type AssistantPropertySearchInput,
  type AssistantPropertySearchResult,
} from "./contracts";

const PROPERTY_CARD_PROJECTION = `
  _id,
  _type,
  status,
  title,
  "slug": slug.current,
  summary,
  community,
  masterDevelopment,
  city,
  country,
  developer,
  category,
  availability,
  listingType,
  unitType,
  bedrooms,
  bathrooms,
  sizeDisplay,
  priceDisplay,
  rentPriceDisplay,
  completionStatus,
  paymentPlan,
  publishedAt,
  "featuredImageUrl": featuredImage.asset->url
`;

const SEARCH_PUBLISHED_PROPERTIES_QUERY = `
  *[
    _type == "property"
    && status == "published"
    && defined(slug.current)
    && !(_id in path("drafts.**"))
    && ($category == "" || category == $category)
    && ($availability == "" || $availability in availability)
    && ($intent == "" || $intent in listingType)
    && ($propertyType == "" || unitType == $propertyType)
    && ($minBedrooms < 0 || bedrooms >= $minBedrooms)
    && ($location == "" || [community, masterDevelopment, city, country] match $location)
    && ($keywords == "" || [title, summary, community, masterDevelopment, city, country, developer, unitType] match $keywords)
  ] | order(featured desc, publishedAt desc) [0...3] {
    ${PROPERTY_CARD_PROJECTION}
  }
`;

const GET_PUBLISHED_PROPERTY_QUERY = `
  *[
    _type == "property"
    && _id == $sanityDocumentId
    && status == "published"
    && defined(slug.current)
    && !(_id in path("drafts.**"))
  ][0] {
    ${PROPERTY_CARD_PROJECTION},
    keyFeatures,
    amenities
  }
`;

const SEARCH_APPROVED_KNOWLEDGE_QUERY = `
  *[
    _type in ["post", "faq"]
    && status == "published"
    && defined(slug.current)
    && !(_id in path("drafts.**"))
    && assistantApproved == true
    && defined(assistantSummary)
    && defined(assistantAsOf)
    && defined(assistantExpiresAt)
    && defined(assistantSourceLabel)
    && defined(assistantSourceUrl)
    && dateTime(assistantAsOf) <= dateTime(now())
    && dateTime(assistantExpiresAt) > dateTime(now())
    && ($documentType == "" || _type == $documentType)
    && [title, question, assistantSummary] match $keywords
  ] | order(assistantAsOf desc) [0...3] {
    _id,
    _type,
    status,
    "approved": assistantApproved,
    "title": coalesce(title, question),
    "slug": slug.current,
    "summary": assistantSummary,
    "sourceLabel": assistantSourceLabel,
    "sourceUrl": assistantSourceUrl,
    "asOf": assistantAsOf,
    "expiresAt": assistantExpiresAt
  }
`;

type PropertyAssistantDataErrorCode =
  | "INVALID_TOOL_INPUT"
  | "SANITY_UNAVAILABLE";

export class PropertyAssistantDataError extends Error {
  readonly code: PropertyAssistantDataErrorCode;

  constructor(code: PropertyAssistantDataErrorCode) {
    super(
      code === "INVALID_TOOL_INPUT"
        ? "The property assistant request is invalid."
        : "Property information is temporarily unavailable.",
    );
    this.name = "PropertyAssistantDataError";
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function safeDocumentId(value: unknown): string | undefined {
  const id = normalizeText(value, 128);
  return id && /^(?!drafts\.)(?!versions\.)[A-Za-z0-9._-]+$/.test(id)
    ? id
    : undefined;
}

function safeSlug(value: unknown): string | undefined {
  const slug = normalizeText(value, 96);
  return slug && /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/.test(slug)
    ? slug
    : undefined;
}

function safeIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function safeNumber(
  value: unknown,
  minimum: number,
  maximum: number,
): number | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : undefined;
}

function safeStringArray(
  value: unknown,
  maximumItems: number,
  maximumItemLength: number,
): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => normalizeText(item, maximumItemLength))
        .filter((item): item is string => Boolean(item)),
    ),
  ].slice(0, maximumItems);
}

function safeSanityImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2_048) return undefined;
  try {
    const url = new URL(value);
    const projectId =
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "jdxbkry4";
    const dataset =
      process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
    const prefix = `/images/${projectId}/${dataset}/`;
    if (
      url.protocol !== "https:" ||
      url.hostname !== "cdn.sanity.io" ||
      !url.pathname.startsWith(prefix) ||
      url.username ||
      url.password
    ) {
      return undefined;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

const DEFAULT_SOURCE_HOSTS = ["hausofestate.com", "www.hausofestate.com"] as const;

function normalizeSourceHost(value: string): string | undefined {
  const hostname = value.trim().toLowerCase().replace(/\.$/, "");
  if (
    hostname.length === 0 ||
    hostname.length > 253 ||
    hostname === "localhost" ||
    !hostname.includes(".") ||
    isIP(hostname) !== 0 ||
    /[@:/\\?#]/.test(hostname)
  ) {
    return undefined;
  }

  const labels = hostname.split(".");
  if (
    labels.some(
      (label) =>
        label.length === 0 ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  ) {
    return undefined;
  }
  return hostname;
}

function approvedSourceHosts(): ReadonlySet<string> {
  const configured = process.env.PROPERTY_ASSISTANT_SOURCE_HOSTS;
  if (!configured?.trim()) return new Set(DEFAULT_SOURCE_HOSTS);

  const entries = configured
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const normalized = entries.map(normalizeSourceHost);

  // A malformed allowlist must never broaden the outbound-link boundary.
  if (normalized.length === 0 || normalized.some((host) => !host)) {
    return new Set();
  }
  return new Set(normalized.filter((host): host is string => Boolean(host)));
}

function safePublicHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2_048) return undefined;
  try {
    const url = new URL(value);
    const hostname = normalizeSourceHost(url.hostname);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !hostname ||
      !approvedSourceHosts().has(hostname)
    ) {
      return undefined;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

function taxonomyValues<T extends string>(
  value: unknown,
  predicate: (candidate: unknown) => candidate is T,
  maximumItems: number,
): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = [...new Set(value.filter(predicate))].slice(0, maximumItems);
  return filtered.length ? filtered : undefined;
}

function sanitizePropertyCard(value: unknown): AssistantPropertyCard | null {
  const raw = asRecord(value);
  if (!raw || raw._type !== "property" || raw.status !== "published") return null;

  const id = safeDocumentId(raw._id);
  const title = normalizeText(raw.title, 140);
  const slug = safeSlug(raw.slug);
  if (!id || !title || !slug) return null;

  const unitType = normalizeText(raw.unitType, 80);
  const candidate = {
    id,
    title,
    slug,
    path: `/properties/${slug}`,
    summary: normalizeText(raw.summary, 280),
    community: normalizeText(raw.community, 120),
    city: normalizeText(raw.city, 80),
    country: normalizeText(raw.country, 80),
    category: isCategory(raw.category) ? raw.category : undefined,
    availability: taxonomyValues(raw.availability, isAvailability, 2),
    listingType: taxonomyValues(raw.listingType, isIntent, 2),
    unitType:
      unitType && ALL_UNIT_TYPES.includes(unitType) ? unitType : undefined,
    bedrooms: safeNumber(raw.bedrooms, 0, 20),
    bathrooms: safeNumber(raw.bathrooms, 0, 20),
    sizeDisplay: normalizeText(raw.sizeDisplay, 120),
    priceDisplay: normalizeText(raw.priceDisplay, 120),
    rentPriceDisplay: normalizeText(raw.rentPriceDisplay, 120),
    publishedAt: safeIsoDate(raw.publishedAt),
    featuredImageUrl: safeSanityImageUrl(raw.featuredImageUrl),
  };
  const parsed = assistantPropertySearchResultSchema.shape.properties.element.safeParse(
    candidate,
  );
  return parsed.success ? parsed.data : null;
}

function sanitizePropertyDetail(value: unknown): AssistantPropertyDetail | null {
  const raw = asRecord(value);
  const card = sanitizePropertyCard(raw);
  if (!raw || !card) return null;

  const candidate = {
    ...card,
    developer: normalizeText(raw.developer, 120),
    masterDevelopment: normalizeText(raw.masterDevelopment, 120),
    completionStatus: normalizeText(raw.completionStatus, 48),
    paymentPlan: normalizeText(raw.paymentPlan, 120),
    keyFeatures: safeStringArray(raw.keyFeatures, 8, 160),
    amenities: safeStringArray(raw.amenities, 8, 160),
  };
  const parsed = assistantPropertyLookupResultSchema.shape.property.unwrap().safeParse(
    candidate,
  );
  return parsed.success ? parsed.data : null;
}

function sanitizeKnowledgeResult(
  value: unknown,
  now: Date,
): AssistantKnowledgeResult | null {
  const raw = asRecord(value);
  if (
    !raw ||
    (raw._type !== "post" && raw._type !== "faq") ||
    raw.status !== "published" ||
    raw.approved !== true
  ) {
    return null;
  }

  const id = safeDocumentId(raw._id);
  const title = normalizeText(raw.title, 240);
  const slug = safeSlug(raw.slug);
  const summary = normalizeText(raw.summary, 1_200);
  const sourceLabel = normalizeText(raw.sourceLabel, 120);
  const sourceUrl = safePublicHttpsUrl(raw.sourceUrl);
  const asOf = safeIsoDate(raw.asOf);
  const expiresAt = safeIsoDate(raw.expiresAt);
  if (
    !id ||
    !title ||
    !slug ||
    !summary ||
    !sourceLabel ||
    !sourceUrl ||
    !asOf ||
    !expiresAt ||
    Date.parse(asOf) > now.getTime() ||
    Date.parse(expiresAt) <= now.getTime() ||
    Date.parse(expiresAt) <= Date.parse(asOf)
  ) {
    return null;
  }

  const kind = raw._type === "post" ? "article" : "faq";
  const candidate = {
    id,
    kind,
    title,
    slug,
    path: kind === "article" ? `/blog/${slug}` : "/faq",
    summary,
    sourceLabel,
    sourceUrl,
    asOf,
    expiresAt,
  };
  const parsed = assistantKnowledgeSearchResultSchema.shape.results.element.safeParse(
    candidate,
  );
  return parsed.success ? parsed.data : null;
}

function matchPattern(value: string | undefined): string {
  if (!value) return "";
  const tokens = value
    .normalize("NFKC")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.slice(0, 8);
  return tokens?.map((token) => `${token.slice(0, 40)}*`).join(" ") ?? "";
}

async function fetchSanity<T>(
  query: string,
  params: Record<string, unknown>,
): Promise<T> {
  try {
    return await client.fetch<T>(query, params, { perspective: "published" });
  } catch {
    throw new PropertyAssistantDataError("SANITY_UNAVAILABLE");
  }
}

export async function searchPublishedProperties(
  input: AssistantPropertySearchInput,
): Promise<AssistantPropertySearchResult> {
  const parsed = assistantPropertySearchInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new PropertyAssistantDataError("INVALID_TOOL_INPUT");
  }

  const filters = parsed.data;
  const raw = await fetchSanity<unknown>(SEARCH_PUBLISHED_PROPERTIES_QUERY, {
    keywords: matchPattern(filters.query),
    category: filters.category ?? "",
    availability: filters.availability ?? "",
    intent: filters.intent ?? "",
    propertyType: filters.propertyType ?? "",
    minBedrooms: filters.minBedrooms ?? -1,
    location: matchPattern(filters.location),
  });
  const values = Array.isArray(raw) ? raw : [];
  const properties = values
    .map(sanitizePropertyCard)
    .filter((property): property is AssistantPropertyCard => Boolean(property))
    .slice(0, MAX_ASSISTANT_PROPERTY_RESULTS);

  const recognizedFilters = {
    category: filters.category,
    availability: filters.availability,
    intent: filters.intent,
    propertyType: filters.propertyType,
    location: filters.location,
    minBedrooms: filters.minBedrooms,
  };
  return assistantPropertySearchResultSchema.parse({
    properties,
    recognizedFilters,
    viewAllPath: buildPropertiesHref({
      category: filters.category,
      availability: filters.availability,
      intent: filters.intent,
      type: filters.propertyType,
      location: filters.location,
      beds: filters.minBedrooms,
    }),
  });
}

export async function getPublishedProperty(
  input: AssistantPropertyLookupInput,
): Promise<AssistantPropertyLookupResult> {
  const parsed = assistantPropertyLookupInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new PropertyAssistantDataError("INVALID_TOOL_INPUT");
  }

  const raw = await fetchSanity<unknown>(GET_PUBLISHED_PROPERTY_QUERY, {
    sanityDocumentId: parsed.data.sanityDocumentId,
  });
  return assistantPropertyLookupResultSchema.parse({
    property: sanitizePropertyDetail(raw),
  });
}

export async function searchApprovedKnowledge(
  input: AssistantKnowledgeSearchInput,
): Promise<AssistantKnowledgeSearchResult> {
  const parsed = assistantKnowledgeSearchInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new PropertyAssistantDataError("INVALID_TOOL_INPUT");
  }

  const raw = await fetchSanity<unknown>(SEARCH_APPROVED_KNOWLEDGE_QUERY, {
    keywords: matchPattern(parsed.data.query),
    documentType:
      parsed.data.kind === "article"
        ? "post"
        : parsed.data.kind === "faq"
          ? "faq"
          : "",
  });
  const now = new Date();
  const values = Array.isArray(raw) ? raw : [];
  const results = values
    .map((value) => sanitizeKnowledgeResult(value, now))
    .filter((result): result is AssistantKnowledgeResult => Boolean(result))
    .slice(0, MAX_ASSISTANT_KNOWLEDGE_RESULTS);

  return assistantKnowledgeSearchResultSchema.parse({ results });
}
