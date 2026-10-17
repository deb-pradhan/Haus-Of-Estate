import assert from "node:assert/strict";
import test from "node:test";
import {
  MemoryRateLimitStore,
  createRateLimiter,
  enforceRateLimit,
  getClientIp,
  isHoneypotTripped,
  isIpAddress,
  submittedTooFast,
  tooManyRequests,
} from "../../src/lib/rate-limit.ts";

const headers = (init) => ({ headers: new Headers(init) });

test("sliding window allows `limit` hits then blocks until the window slides", () => {
  const store = new MemoryRateLimitStore();
  const t0 = 1_000_000;
  const r = [0, 1, 2].map((i) => store.hit("k", 10_000, 3, t0 + i * 1000));
  assert.deepEqual(r.map((x) => x.allowed), [true, true, true]);
  assert.deepEqual(r.map((x) => x.remaining), [2, 1, 0]);

  const blocked = store.hit("k", 10_000, 3, t0 + 5000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  // Oldest hit (t0) leaves the window at t0 + 10_000 => 5 s from now.
  assert.equal(blocked.retryAfterSeconds, 5);

  // Blocked hits are not recorded: once the oldest expires one slot reopens.
  assert.equal(store.hit("k", 10_000, 3, t0 + 10_001).allowed, true);
  assert.equal(store.hit("k", 10_000, 3, t0 + 10_002).allowed, false);
});

test("keys are independent and the store evicts beyond maxKeys", () => {
  const store = new MemoryRateLimitStore(3);
  for (const k of ["a", "b", "c", "d", "e"]) store.hit(k, 1000, 1, 1);
  assert.equal(store.size, 3);
  assert.equal(store.hit("a", 1000, 1, 2).allowed, true, "evicted key starts fresh");
  assert.equal(store.hit("e", 1000, 1, 2).allowed, false);
});

test("sweep removes expired buckets", () => {
  const store = new MemoryRateLimitStore(100, 10);
  store.hit("x", 100, 5, 0);
  store.hit("y", 100, 5, 0);
  store.hit("z", 100, 5, 1_000);
  assert.equal(store.size, 1);
});

test("createRateLimiter namespaces keys and accepts a pluggable store", async () => {
  const calls = [];
  const fake = {
    async hit(key, windowMs, limit) {
      calls.push([key, windowMs, limit]);
      return { allowed: true, limit, remaining: limit - 1, retryAfterSeconds: 0, resetAt: 0 };
    },
  };
  const limiter = createRateLimiter({ id: "leads", limit: 5, windowMs: 60_000, store: fake });
  await limiter.check("ip:1.2.3.4");
  assert.deepEqual(calls, [["leads:ip:1.2.3.4", 60_000, 5]]);
});

test("a failing store fails open (never blocks lead capture)", async () => {
  const broken = {
    hit() {
      throw new Error("redis down");
    },
  };
  const limiter = createRateLimiter({ id: "x", limit: 1, windowMs: 1000, store: broken });
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal((await limiter.check("k")).allowed, true);
  } finally {
    console.error = original;
  }
});

test("enforceRateLimit returns a 429 with Retry-After, null otherwise", async () => {
  const store = new MemoryRateLimitStore();
  const limiter = createRateLimiter({ id: "t1", limit: 2, windowMs: 60_000, store });
  const req = headers({ "x-forwarded-for": "9.9.9.9" });
  assert.equal(await enforceRateLimit(req, limiter), null);
  assert.equal(await enforceRateLimit(req, limiter), null);
  const res = await enforceRateLimit(req, limiter);
  assert.equal(res.status, 429);
  assert.ok(Number(res.headers.get("retry-after")) >= 1);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.match((await res.json()).error, /Too many requests/);
  // A different IP is unaffected.
  assert.equal(await enforceRateLimit(headers({ "x-forwarded-for": "8.8.8.8" }), limiter), null);
});

test("enforceRateLimit also limits by the extra key across IPs", async () => {
  const store = new MemoryRateLimitStore();
  const limiter = createRateLimiter({ id: "t2", limit: 2, windowMs: 60_000, store });
  const from = (ip) => headers({ "x-forwarded-for": ip });
  assert.equal(await enforceRateLimit(from("1.1.1.1"), limiter, "Victim@Example.com"), null);
  assert.equal(await enforceRateLimit(from("2.2.2.2"), limiter, "victim@example.com"), null);
  const res = await enforceRateLimit(from("3.3.3.3"), limiter, "VICTIM@example.com");
  assert.equal(res?.status, 429);
});

test("tooManyRequests exposes limit headers without internals", async () => {
  const res = tooManyRequests({ allowed: false, limit: 5, remaining: 0, retryAfterSeconds: 42, resetAt: 0 });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "42");
  assert.equal(res.headers.get("x-ratelimit-limit"), "5");
});

test("getClientIp counts XFF from the right so spoofed prefixes are ignored", () => {
  // One trusted proxy (Railway) appended 203.0.113.7; the left part is attacker supplied.
  const spoofed = headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" });
  assert.equal(getClientIp(spoofed, 1), "203.0.113.7");
  // Two hops (e.g. Cloudflare -> Railway): second from the right.
  assert.equal(getClientIp(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 10.0.0.1" }), 2), "203.0.113.7");
  // Fewer entries than hops: fall back to the first entry.
  assert.equal(getClientIp(headers({ "x-forwarded-for": "203.0.113.7" }), 3), "203.0.113.7");
});

test("getClientIp validates addresses and honours trustedProxyCount=0", () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "not-an-ip" }), 1), "unknown");
  assert.equal(getClientIp(headers({ "x-forwarded-for": "1.2.3.4" }), 0), "unknown");
  assert.equal(getClientIp(headers({}), 1), "unknown");
  assert.equal(getClientIp(headers({ "x-real-ip": "5.6.7.8" }), 1), "5.6.7.8");
  assert.equal(getClientIp(headers({ "x-forwarded-for": "2001:db8::1" }), 1), "2001:db8::1");
});

test("isIpAddress", () => {
  for (const ok of ["1.2.3.4", "255.255.255.255", "::1", "2001:db8::ff00:42:8329"]) assert.equal(isIpAddress(ok), true, ok);
  for (const bad of ["", "256.1.1.1", "1.2.3", "evil<script>", "a".repeat(60)]) assert.equal(isIpAddress(bad), false, bad);
});

test("honeypot helpers", () => {
  assert.equal(isHoneypotTripped(""), false);
  assert.equal(isHoneypotTripped("   "), false);
  assert.equal(isHoneypotTripped(undefined, null), false);
  assert.equal(isHoneypotTripped("", "http://spam.example"), true);
  assert.equal(submittedTooFast(1000, 1500, 1500), true);
  assert.equal(submittedTooFast("1000", 1500, 3000), false);
  assert.equal(submittedTooFast(undefined), false, "no signal never blocks");
});
