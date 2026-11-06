import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { BrochureUnavailableError, isBrochureIdentifier } from "./catalog";
import type { BrochureEnvironment, BrochureSelection } from "./catalog";

const LIFETIME_SECONDS = 7 * 24 * 60 * 60;
// Match delivery's tolerance for database/worker clock skew. Expiry itself stays fixed.
const CLOCK_SKEW_SECONDS = 60;
type DownloadClaims = { v: 1; k: string; r: string; p: string; e: number; n: string };

export function readBrochureLinkConfig(environment: BrochureEnvironment = process.env) {
  const secret = environment.BROCHURE_LINK_SECRET;
  if (environment.BROCHURE_EMAIL_ENABLED !== "true" || !secret || secret.length < 32) {
    throw new BrochureUnavailableError();
  }
  const origin = new URL(environment.BROCHURE_PUBLIC_ORIGIN || "");
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  const development = ["test", "development"].includes(environment.NODE_ENV || "");
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash ||
    (origin.protocol !== "https:" && !(development && loopback && origin.protocol === "http:")) ||
    (loopback && !development)) throw new BrochureUnavailableError();
  return { secret, origin: origin.origin };
}

/** Stable across retries: expiry is anchored to the durable outbox event, not send time. */
export function createBrochureDownloadUrl(
  selection: BrochureSelection,
  eventId: string,
  createdAt: Date,
  environment: BrochureEnvironment = process.env,
): string {
  try {
    const { secret, origin } = readBrochureLinkConfig(environment);
    if (![selection.key, selection.revision, selection.projectSlug].every(isBrochureIdentifier) ||
      !eventId || eventId.length > 500 || !Number.isFinite(createdAt.getTime())) {
      throw new BrochureUnavailableError();
    }
    const claims: DownloadClaims = {
      v: 1, k: selection.key, r: selection.revision, p: selection.projectSlug,
      e: Math.floor(createdAt.getTime() / 1000) + LIFETIME_SECONDS,
      n: createHash("sha256").update(eventId).digest("hex").slice(0, 32),
    };
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    return `${origin}/api/brochures/${payload}.${signature}`;
  } catch {
    throw new BrochureUnavailableError();
  }
}

export function verifyBrochureDownloadToken(
  token: string,
  environment: BrochureEnvironment = process.env,
  now: Date = new Date(),
): { key: string; revision: string; projectSlug: string; expiresAt: Date } {
  try {
    const { secret } = readBrochureLinkConfig(environment);
    if (token.length > 1800 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new BrochureUnavailableError();
    }
    const [payload, signature] = token.split(".");
    const expected = createHmac("sha256", secret).update(payload).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new BrochureUnavailableError();
    }
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DownloadClaims;
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (claims.v !== 1 || ![claims.k, claims.r, claims.p].every(isBrochureIdentifier) ||
      !Number.isSafeInteger(claims.e) || claims.e <= nowSeconds ||
      claims.e > nowSeconds + LIFETIME_SECONDS + CLOCK_SKEW_SECONDS ||
      typeof claims.n !== "string" || !/^[a-f0-9]{32}$/.test(claims.n)) {
      throw new BrochureUnavailableError();
    }
    return { key: claims.k, revision: claims.r, projectSlug: claims.p, expiresAt: new Date(claims.e * 1000) };
  } catch {
    throw new BrochureUnavailableError();
  }
}
