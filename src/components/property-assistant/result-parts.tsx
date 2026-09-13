"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, MapPin } from "lucide-react";
import { useEffect } from "react";
import {
  emitAssistantAnalytics,
  type AssistantRouteScope,
} from "./analytics";

export interface AssistantPropertyResult {
  id: string;
  title: string;
  slug: string;
  path: string;
  summary?: string;
  community?: string;
  city?: string;
  country?: string;
  category?: string;
  availability?: string[];
  listingType?: string[];
  unitType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeDisplay?: string;
  priceDisplay?: string;
  rentPriceDisplay?: string;
  featuredImageUrl?: string;
}

interface AssistantKnowledgeResult {
  id: string;
  title: string;
  slug: string;
  path: string;
  kind: "article" | "faq";
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  asOf: string;
  expiresAt: string;
}

interface AssistantPropertyResultMeta {
  viewAllPath: string;
  recognizedFilters: string[];
}

export interface AssistantRecognizedFilters {
  category?: string;
  availability?: string;
  intent?: "sale" | "rent";
  propertyType?: string;
  location?: string;
  minBedrooms?: number;
}

function optionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.length <= 500 ? value : undefined;
}

function stringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string").slice(0, 5);
}

function safeDocumentId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 128 &&
    /^(?!drafts\.)(?!versions\.)[A-Za-z0-9._-]+$/.test(value)
  );
}

function safeIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function safePropertyPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\/properties\/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/.test(value)
  );
}

function safeKnowledgePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value === "/faq" ||
      /^\/blog\/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/.test(value))
  );
}

function safeHttpsSource(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      value.length <= 2_048
    );
  } catch {
    return false;
  }
}

function safeViewAllPath(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 500 ||
    !value.startsWith("/properties")
  ) {
    return false;
  }
  try {
    const url = new URL(value, "https://hausofestate.com");
    const allowedKeys = new Set([
      "category",
      "availability",
      "intent",
      "type",
      "location",
      "beds",
    ]);
    return (
      url.origin === "https://hausofestate.com" &&
      url.pathname === "/properties" &&
      !url.hash &&
      [...url.searchParams].every(
        ([key, item]) => allowedKeys.has(key) && item.length <= 100,
      )
    );
  } catch {
    return false;
  }
}

function safeImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "cdn.sanity.io";
  } catch {
    return false;
  }
}

function propertyResult(value: unknown): AssistantPropertyResult | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    !safeDocumentId(record.id) ||
    typeof record.title !== "string" ||
    typeof record.slug !== "string" ||
    !safePropertyPath(record.path)
  ) {
    return null;
  }

  return {
    id: record.id.slice(0, 128),
    title: record.title.slice(0, 200),
    slug: record.slug.slice(0, 128),
    path: record.path,
    summary: optionalString(record, "summary"),
    community: optionalString(record, "community"),
    city: optionalString(record, "city"),
    country: optionalString(record, "country"),
    category: optionalString(record, "category"),
    availability: stringArray(record, "availability"),
    listingType: stringArray(record, "listingType"),
    unitType: optionalString(record, "unitType"),
    bedrooms:
      typeof record.bedrooms === "number" && Number.isFinite(record.bedrooms)
        ? record.bedrooms
        : undefined,
    bathrooms:
      typeof record.bathrooms === "number" && Number.isFinite(record.bathrooms)
        ? record.bathrooms
        : undefined,
    sizeDisplay: optionalString(record, "sizeDisplay"),
    priceDisplay: optionalString(record, "priceDisplay"),
    rentPriceDisplay: optionalString(record, "rentPriceDisplay"),
    featuredImageUrl: safeImageUrl(record.featuredImageUrl)
      ? record.featuredImageUrl
      : undefined,
  };
}

export function readPropertyResults(output: unknown): AssistantPropertyResult[] {
  let candidates: unknown[] = [];
  if (Array.isArray(output)) candidates = output;
  else if (typeof output === "object" && output !== null) {
    const record = output as Record<string, unknown>;
    if (Array.isArray(record.properties)) candidates = record.properties;
    else if (Array.isArray(record.results)) candidates = record.results;
    else if (typeof record.property === "object" && record.property !== null) {
      candidates = [record.property];
    }
    else candidates = [output];
  }

  const unique = new Map<string, AssistantPropertyResult>();
  for (const candidate of candidates) {
    const parsed = propertyResult(candidate);
    if (parsed) unique.set(parsed.id, parsed);
    if (unique.size === 3) break;
  }
  return [...unique.values()];
}

function knowledgeResult(value: unknown): AssistantKnowledgeResult | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    !safeDocumentId(record.id) ||
    typeof record.title !== "string" ||
    typeof record.slug !== "string" ||
    (record.kind !== "article" && record.kind !== "faq") ||
    !safeKnowledgePath(record.path) ||
    typeof record.summary !== "string" ||
    typeof record.sourceLabel !== "string" ||
    !safeHttpsSource(record.sourceUrl) ||
    !safeIsoDate(record.asOf) ||
    !safeIsoDate(record.expiresAt) ||
    Date.parse(record.expiresAt) <= Date.now()
  ) {
    return null;
  }
  return {
    id: record.id.slice(0, 128),
    title: record.title.slice(0, 200),
    slug: record.slug.slice(0, 128),
    path: record.path,
    kind: record.kind,
    summary: record.summary.slice(0, 500),
    sourceLabel: record.sourceLabel.slice(0, 120),
    sourceUrl: record.sourceUrl,
    asOf: record.asOf,
    expiresAt: record.expiresAt,
  };
}

export function readKnowledgeResults(output: unknown): AssistantKnowledgeResult[] {
  const candidates = Array.isArray(output)
    ? output
    : typeof output === "object" && output !== null
      ? Array.isArray(Reflect.get(output, "results"))
        ? (Reflect.get(output, "results") as unknown[])
        : [output]
      : [];
  return candidates
    .map(knowledgeResult)
    .filter((item): item is AssistantKnowledgeResult => Boolean(item))
    .slice(0, 3);
}

function filterLabel(key: string, value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const labels: Record<string, string> = {
    category: "Category",
    availability: "Availability",
    intent: "For",
    propertyType: "Type",
    location: "Location",
    minBedrooms: "Bedrooms",
  };
  const label = labels[key];
  if (!label) return undefined;
  const display = String(value).replaceAll("-", " ").slice(0, 100);
  return `${label}: ${display}`;
}

export function readRecognizedFilters(
  output: unknown,
): AssistantRecognizedFilters {
  if (typeof output !== "object" || output === null) return {};
  const filters = Reflect.get(output, "recognizedFilters");
  if (typeof filters !== "object" || filters === null || Array.isArray(filters)) {
    return {};
  }
  const record = filters as Record<string, unknown>;
  const boundedString = (key: string) => {
    const value = record[key];
    return typeof value === "string" && value.length <= 100
      ? value
      : undefined;
  };
  const intent = record.intent;
  const minBedrooms = record.minBedrooms;
  return {
    category: boundedString("category"),
    availability: boundedString("availability"),
    intent: intent === "sale" || intent === "rent" ? intent : undefined,
    propertyType: boundedString("propertyType"),
    location: boundedString("location"),
    minBedrooms:
      typeof minBedrooms === "number" &&
      Number.isInteger(minBedrooms) &&
      minBedrooms >= 0 &&
      minBedrooms <= 20
        ? minBedrooms
        : undefined,
  };
}

export function readPropertyResultMeta(
  output: unknown,
): AssistantPropertyResultMeta {
  if (typeof output !== "object" || output === null) {
    return { viewAllPath: "/properties", recognizedFilters: [] };
  }
  const record = output as Record<string, unknown>;
  const recognizedFilters = Object.entries(readRecognizedFilters(output))
    .flatMap(([key, value]) => {
      const label = filterLabel(key, value);
      return label ? [label] : [];
    })
    .slice(0, 6);
  return {
    viewAllPath: safeViewAllPath(record.viewAllPath)
      ? record.viewAllPath
      : "/properties",
    recognizedFilters,
  };
}

export function AssistantPropertyResults({
  output,
  routeScope,
  onAdviser,
}: {
  output: unknown;
  routeScope: AssistantRouteScope;
  onAdviser: (property: AssistantPropertyResult) => void;
}) {
  const properties = readPropertyResults(output);
  const meta = readPropertyResultMeta(output);

  useEffect(() => {
    if (properties.length > 0) {
      emitAssistantAnalytics({
        name: "property_assistant_results_shown",
        routeScope,
        resultCount: properties.length,
      });
    }
  }, [properties.length, routeScope]);

  if (properties.length === 0) return null;

  return (
    <div className="space-y-3" aria-label="Property results">
      {meta.recognizedFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Recognised filters">
          {meta.recognizedFilters.map((filter) => (
            <span
              key={filter}
              className="rounded-full bg-estate-700/8 px-2.5 py-1 text-[11px] font-medium text-estate-700"
            >
              {filter}
            </span>
          ))}
        </div>
      )}
      {properties.map((property) => (
        <article
          key={property.id}
          className="overflow-hidden rounded-lg border border-border bg-surface"
        >
          <Link href={property.path} className="group flex min-h-28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700/50">
            <div className="relative w-28 shrink-0 bg-estate-700/8">
              {property.featuredImageUrl ? (
                <Image
                  src={property.featuredImageUrl}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Building2 className="h-7 w-7 text-estate-700/30" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 p-3">
              <p className="text-[10px] font-semibold uppercase text-gold-600">
                {property.unitType || "Property"}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-estate-700 group-hover:underline">
                {property.title}
              </h3>
              {(property.community || property.city) && (
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[property.community, property.city].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="mt-2 text-sm font-semibold text-estate-700">
                {property.priceDisplay || property.rentPriceDisplay || "Price on application"}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => onAdviser(property)}
            className="flex min-h-11 w-full items-center justify-between border-t border-border px-3 text-left text-xs font-semibold text-estate-700 hover:bg-estate-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700/50 focus-visible:ring-inset"
            aria-label={`Discuss ${property.title} with an adviser`}
          >
            Discuss this property <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </article>
      ))}
      <Link
        href={meta.viewAllPath}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-estate-700 underline-offset-4 hover:underline"
      >
        View all matches <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function AssistantKnowledgeResults({ output }: { output: unknown }) {
  const sources = readKnowledgeResults(output);
  if (sources.length === 0) return null;

  return (
    <div className="space-y-2" aria-label="Haus sources">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
        Approved sources
      </p>
      {sources.map((source) => (
        <div
          key={source.id}
          className="rounded-lg border border-border bg-surface p-3"
        >
          <Link
            href={source.path}
            className="group flex min-h-11 items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700/50"
          >
            <span className="text-sm font-medium leading-snug text-estate-700 group-hover:underline">
              {source.title}
            </span>
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          </Link>
          <a
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-estate-700 hover:underline"
          >
            <CalendarDays className="h-3 w-3" /> {source.sourceLabel} ·{" "}
            {new URL(source.sourceUrl).hostname}
          </a>
        </div>
      ))}
    </div>
  );
}

export function AssistantToolLoading({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-subtle/60 p-3" aria-live="polite">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-estate-700" />
        {label}
      </div>
    </div>
  );
}
