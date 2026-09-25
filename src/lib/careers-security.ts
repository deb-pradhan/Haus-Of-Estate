import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { getClientIp, isSameOriginRequest } from "@/lib/auth/request-security";

// Best-effort abuse protection per server process, not a shared or durable quota.
// No applicant data or raw IP addresses are retained in these bounded buckets.
const salt = randomBytes(32);
const MAX_BUCKETS = 5_000;
const buckets = new Map<string, { count: number; expiresAt: number }>();

export { isSameOriginRequest as isAllowedCareersOrigin };

export function careersThrottle(kind: "ip" | "email", value: string, now = Date.now()): number {
  const limit = kind === "ip" ? 10 : 3;
  const windowMs = (kind === "ip" ? 10 : 60) * 60_000;
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt <= now) buckets.delete(key);
  }
  const key = createHmac("sha256", salt).update(`${kind}:${value.trim().toLowerCase()}`).digest("hex");
  const current = buckets.get(key);
  if (current) {
    if (current.count >= limit) return Math.max(1, Math.ceil((current.expiresAt - now) / 1_000));
    current.count += 1;
    return 0;
  }
  // At capacity reject new identities instead of evicting active limits.
  if (buckets.size >= MAX_BUCKETS) return 60;
  buckets.set(key, { count: 1, expiresAt: now + windowMs });
  return 0;
}

export function throttleCareersIp(request: Request): number {
  return careersThrottle("ip", getClientIp(request));
}
