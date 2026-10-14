import { isIP } from "node:net";
import { AuthConfigurationError } from "@/lib/auth/errors";

function asOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function configuredOrigins(): Set<string> {
  const origins = new Set<string>();
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    ...(process.env.AUTH_ALLOWED_ORIGINS ?? "").split(","),
  ];

  for (const candidate of candidates) {
    const origin = asOrigin(candidate?.trim());
    if (origin) origins.add(origin);
  }

  return origins;
}

export function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const suppliedOrigin = asOrigin(request.headers.get("origin"));
  if (!suppliedOrigin) return false;

  const allowed = configuredOrigins();
  const requestOrigin = asOrigin(request.url);
  if (process.env.NODE_ENV !== "production" && requestOrigin) {
    allowed.add(requestOrigin);
  }

  return allowed.has(suppliedOrigin);
}

export function getClientIp(request: Request): string {
  if (process.env.AUTH_TRUST_PROXY_HEADERS !== "true") {
    if (process.env.NODE_ENV === "production") {
      throw new AuthConfigurationError("AUTH_PROXY_TRUST_MISSING");
    }
    return "proxy-headers-disabled";
  }

  const trustedHeader = process.env.AUTH_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (!trustedHeader && process.env.NODE_ENV === "production") {
    throw new AuthConfigurationError("AUTH_CLIENT_IP_HEADER_MISSING");
  }

  const normalizeIp = (value: string | null): string | null => {
    if (!value) return null;
    const candidate = value.trim().replace(/^"|"$/g, "");
    if (isIP(candidate)) return candidate.toLowerCase();

    const bracketed = candidate.match(/^\[([^\]]+)\](?::\d+)?$/);
    if (bracketed?.[1] && isIP(bracketed[1])) {
      return bracketed[1].toLowerCase();
    }

    const ipv4WithPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (ipv4WithPort?.[1] && isIP(ipv4WithPort[1])) return ipv4WithPort[1];
    return null;
  };

  const configuredValue = request.headers.get(trustedHeader ?? "x-real-ip");
  const clientIp = normalizeIp(configuredValue);
  if (clientIp) return clientIp;

  if (process.env.NODE_ENV === "production") {
    throw new AuthConfigurationError("AUTH_CLIENT_IP_MISSING");
  }
  return "ip-unavailable";
}
