import { createHmac } from "node:crypto";
import { LeadInfrastructureError, LeadOriginError } from "./errors";

const PRODUCTION_ORIGINS = [
  "https://hausofestate.com",
  "https://www.hausofestate.com",
];

export interface LeadIntakeEnvironment {
  LEAD_INTAKE_ENABLED?: string;
  LEAD_ALLOWED_ORIGINS?: string;
  LEAD_RATE_LIMIT_SECRET?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  SITE_URL?: string;
  NODE_ENV?: string;
}

function originFromUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export function isLeadIntakeEnabled(
  environment: LeadIntakeEnvironment = process.env,
): boolean {
  return environment.LEAD_INTAKE_ENABLED?.toLowerCase() === "true";
}

export function allowedLeadOrigins(
  environment: LeadIntakeEnvironment = process.env,
): Set<string> {
  const configured = (environment.LEAD_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => originFromUrl(value.trim()))
    .filter((value): value is string => Boolean(value));

  const applicationOrigins = [
    originFromUrl(environment.NEXT_PUBLIC_SITE_URL),
    originFromUrl(environment.SITE_URL),
  ].filter((value): value is string => Boolean(value));

  return new Set([...PRODUCTION_ORIGINS, ...applicationOrigins, ...configured]);
}

export function assertAllowedLeadOrigin(
  request: Request,
  environment: LeadIntakeEnvironment = process.env,
): void {
  if (environment.NODE_ENV !== "production") return;
  const origin = originFromUrl(request.headers.get("origin") ?? undefined);
  if (!origin || !allowedLeadOrigins(environment).has(origin)) {
    throw new LeadOriginError();
  }
}

export function isHoneypotFilled(body: unknown): boolean {
  if (!body || typeof body !== "object" || !("website" in body)) return false;
  const value = (body as { website?: unknown }).website;
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

export function extractClientAddress(
  request: Request,
  environment: LeadIntakeEnvironment = process.env,
): string {
  const railwayAddress = request.headers.get("x-real-ip")?.trim();
  if (railwayAddress) return railwayAddress;

  if (environment.NODE_ENV !== "production") {
    const forwarded = request.headers.get("x-forwarded-for");
    const first = forwarded?.split(",", 1)[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

export function hashClientAddress(
  address: string,
  environment: LeadIntakeEnvironment = process.env,
): string {
  const secret = environment.LEAD_RATE_LIMIT_SECRET;
  if (!secret && environment.NODE_ENV === "production") {
    throw new LeadInfrastructureError();
  }

  return createHmac(
    "sha256",
    secret || "haus-lead-intake-development-only",
  )
    .update(address)
    .digest("hex");
}

export function isV2LeadPayload(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const candidate = body as Record<string, unknown>;
  return (
    "contact" in candidate ||
    "interest" in candidate ||
    "formVersion" in candidate ||
    "context" in candidate
  );
}
