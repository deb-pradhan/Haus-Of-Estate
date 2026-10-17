/**
 * Rate limiting + bot-protection helpers for API routes.
 *
 * - `MemoryRateLimitStore`: in-process sliding-window log. Good for one Railway
 *   replica and for development. It is NOT shared across replicas or restarts.
 * - `RateLimitStore`: the pluggable interface. To move to Redis/Upstash/Postgres,
 *   implement `hit()` (e.g. with a Lua script or a sorted set) and pass it to
 *   `createRateLimiter({ store })`, or call `setDefaultRateLimitStore()` once at
 *   boot. Route code does not change.
 *
 * Self-contained (no imports) so it is unit-testable with
 * `node --experimental-strip-types --test`.
 */

export interface RateLimitResult {
  /** True when the request is within the limit and was recorded. */
  allowed: boolean;
  /** The configured maximum number of hits per window. */
  limit: number;
  /** Hits still available in the current window. */
  remaining: number;
  /** Whole seconds until a blocked caller may retry (0 when allowed). */
  retryAfterSeconds: number;
  /** Epoch ms at which the oldest recorded hit leaves the window. */
  resetAt: number;
}

export interface RateLimitStore {
  hit(
    key: string,
    windowMs: number,
    limit: number,
    now?: number,
  ): RateLimitResult | Promise<RateLimitResult>;
}

type Bucket = { hits: number[]; windowMs: number };

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, Bucket>();
  private lastSweep = 0;

  private readonly maxKeys: number;
  private readonly sweepIntervalMs: number;

  // No parameter properties: keeps the file runnable under Node's type stripping.
  constructor(maxKeys = 10_000, sweepIntervalMs = 60_000) {
    this.maxKeys = maxKeys;
    this.sweepIntervalMs = sweepIntervalMs;
  }

  get size(): number {
    return this.buckets.size;
  }

  clear(): void {
    this.buckets.clear();
  }

  hit(key: string, windowMs: number, limit: number, now = Date.now()): RateLimitResult {
    this.sweep(now);

    const bucket = this.buckets.get(key) ?? { hits: [], windowMs };
    bucket.windowMs = windowMs;
    // Drop hits that have slid out of the window.
    const cutoff = now - windowMs;
    let firstLive = 0;
    while (firstLive < bucket.hits.length && bucket.hits[firstLive] <= cutoff) {
      firstLive++;
    }
    if (firstLive > 0) bucket.hits.splice(0, firstLive);

    if (bucket.hits.length >= limit) {
      // Blocked hits are not recorded, so a patient caller is released on time.
      const resetAt = bucket.hits[0] + windowMs;
      this.buckets.delete(key);
      this.buckets.set(key, bucket);
      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
        resetAt,
      };
    }

    bucket.hits.push(now);
    // Re-insert to keep Map order roughly LRU for eviction.
    this.buckets.delete(key);
    this.buckets.set(key, bucket);
    this.evict();

    return {
      allowed: true,
      limit,
      remaining: limit - bucket.hits.length,
      retryAfterSeconds: 0,
      resetAt: bucket.hits[0] + windowMs,
    };
  }

  private sweep(now: number) {
    if (now - this.lastSweep < this.sweepIntervalMs) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      const newest = bucket.hits[bucket.hits.length - 1] ?? 0;
      if (newest <= now - bucket.windowMs) this.buckets.delete(key);
    }
  }

  private evict() {
    while (this.buckets.size > this.maxKeys) {
      const oldest = this.buckets.keys().next().value;
      if (oldest === undefined) break;
      this.buckets.delete(oldest);
    }
  }
}

// Survive Next.js dev HMR / module re-evaluation within one process.
const globalForLimit = globalThis as unknown as {
  __hausRateLimitStore?: RateLimitStore;
};

export function getDefaultRateLimitStore(): RateLimitStore {
  globalForLimit.__hausRateLimitStore ??= new MemoryRateLimitStore();
  return globalForLimit.__hausRateLimitStore;
}

/** Swap the shared store (e.g. a Redis-backed one) once at boot. */
export function setDefaultRateLimitStore(store: RateLimitStore): void {
  globalForLimit.__hausRateLimitStore = store;
}

export interface RateLimiter {
  readonly id: string;
  readonly limit: number;
  readonly windowMs: number;
  check(key: string, now?: number): Promise<RateLimitResult>;
}

export function createRateLimiter(options: {
  /** Namespace so different routes never share counters. */
  id: string;
  limit: number;
  windowMs: number;
  /** Defaults to the shared in-memory store. */
  store?: RateLimitStore;
}): RateLimiter {
  const { id, limit, windowMs } = options;
  return {
    id,
    limit,
    windowMs,
    async check(key, now) {
      const store = options.store ?? getDefaultRateLimitStore();
      try {
        return await store.hit(`${id}:${key}`, windowMs, limit, now);
      } catch (error) {
        // Fail open: a broken limiter must never take lead capture offline.
        console.error(`[rate-limit:${id}] store error`, (error as Error)?.message);
        return {
          allowed: true,
          limit,
          remaining: limit,
          retryAfterSeconds: 0,
          resetAt: (now ?? Date.now()) + windowMs,
        };
      }
    },
  };
}

// ── Client IP ──────────────────────────────────────────────────────────────

/** Minimal IPv4/IPv6 shape check (rejects junk, never throws). */
export function isIpAddress(value: string): boolean {
  if (value.length === 0 || value.length > 45) return false;
  const v4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
  if (v4.test(value)) return true;
  // IPv6 (incl. compressed and v4-mapped); deliberately permissive on grouping.
  return /^[0-9A-Fa-f:.]+$/.test(value) && value.includes(":") && value.split(":").length <= 9;
}

type HeaderSource = { headers: { get(name: string): string | null } };

/**
 * Best-effort client IP behind reverse proxies.
 *
 * `X-Forwarded-For` is `client, proxy1, proxy2…` where each proxy APPENDS the
 * address it received the request from. Anything left of the entries added by
 * *our own* proxies is attacker-controlled, so we count from the right:
 * `TRUSTED_PROXY_COUNT` (default 1 = one proxy in front, e.g. Railway) picks
 * the entry that proxy appended. Set it to 0 to ignore forwarding headers (the
 * limiter then uses a single shared "unknown" bucket), or 2 if Cloudflare sits
 * in front of Railway.
 */
export function getClientIp(
  request: HeaderSource,
  trustedProxyCount: number = Number(process.env.TRUSTED_PROXY_COUNT ?? "1"),
): string {
  const hops = Number.isFinite(trustedProxyCount) ? Math.floor(trustedProxyCount) : 1;
  if (hops > 0) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const parts = forwarded
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const picked = parts[parts.length - hops] ?? parts[0];
      if (picked && isIpAddress(picked)) return picked;
    }
    const real = request.headers.get("x-real-ip")?.trim();
    if (real && isIpAddress(real)) return real;
  }
  return "unknown";
}

// ── Responses ──────────────────────────────────────────────────────────────

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };
  if (!result.allowed) headers["Retry-After"] = String(result.retryAfterSeconds);
  return headers;
}

/** Standard 429 JSON response (UK English, no internals leaked). */
export function tooManyRequests(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait a moment and try again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        ...rateLimitHeaders(result),
      },
    },
  );
}

/**
 * One-liner for route handlers:
 *
 *   const limited = await enforceRateLimit(request, limiter);
 *   if (limited) return limited;
 *
 * `extraKey` adds a second dimension (e.g. the submitted email) so one person
 * cannot hammer from many IPs. Both buckets must allow the request.
 */
export async function enforceRateLimit(
  request: HeaderSource,
  limiter: RateLimiter,
  extraKey?: string,
): Promise<Response | null> {
  const ip = getClientIp(request);
  const byIp = await limiter.check(`ip:${ip}`);
  if (!byIp.allowed) return tooManyRequests(byIp);
  if (extraKey) {
    const byKey = await limiter.check(`key:${extraKey.toLowerCase().slice(0, 254)}`);
    if (!byKey.allowed) return tooManyRequests(byKey);
  }
  return null;
}

// ── Honeypot ───────────────────────────────────────────────────────────────

/**
 * Honeypot: render a visually hidden, `tabindex="-1"`, `autocomplete="off"`
 * field (commonly named "website"). Humans leave it empty; naive bots fill it.
 * Respond with a fake success so the bot learns nothing.
 */
export function isHoneypotTripped(...values: unknown[]): boolean {
  return values.some((v) => typeof v === "string" && v.trim().length > 0);
}

/**
 * Optional time trap: the form records a timestamp when it renders; a
 * submission faster than `minMs` after that is almost certainly a script.
 */
export function submittedTooFast(
  renderedAtMs: unknown,
  minMs = 1500,
  now = Date.now(),
): boolean {
  const t = typeof renderedAtMs === "string" ? Number(renderedAtMs) : renderedAtMs;
  if (typeof t !== "number" || !Number.isFinite(t) || t <= 0) return false; // no signal: do not block
  return now - t < minMs;
}
