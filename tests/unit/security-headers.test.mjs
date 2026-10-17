import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import nextConfig from "../../next.config.ts";

const flatten = (rules) =>
  Object.fromEntries(rules.flatMap((r) => r.headers.map((h) => [h.key, h.value])));

test("poweredByHeader is off and the www redirect is retained", async () => {
  assert.equal(nextConfig.poweredByHeader, false);
  const redirects = await nextConfig.redirects();
  assert.equal(redirects[0].destination, "https://hausofestate.com/:path*");
});

test("all routes get the base security headers", async () => {
  const rules = await nextConfig.headers();
  const base = flatten(rules.filter((r) => r.source === "/:path*"));
  assert.equal(base["X-Content-Type-Options"], "nosniff");
  assert.equal(base["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(base["Strict-Transport-Security"], /max-age=\d{8,}/);
  assert.match(base["Permissions-Policy"], /camera=\(\)/);
  assert.match(base["Permissions-Policy"], /microphone=\(\)/);
  assert.match(base["Permissions-Policy"], /geolocation=\(\)/);
});

test("CSP and framing headers apply to the app but exempt /studio", async () => {
  const rules = await nextConfig.headers();
  const appRule = rules.find((r) => r.headers.some((h) => h.key === "Content-Security-Policy"));
  assert.ok(appRule, "an enforcing (not report-only) CSP rule exists");
  assert.ok(!rules.some((r) => r.headers.some((h) => h.key === "Content-Security-Policy-Report-Only")));

  // Mirror how Next compiles `source` (path-to-regexp) for the named group.
  const pattern = new RegExp(`^/(?:(?!studio(?:/|$)).*)$`);
  assert.match(appRule.source, /studio/);
  for (const path of ["/", "/properties", "/studios", "/api/health", "/blog/studio-tips"]) {
    assert.match(path, pattern, `${path} gets the CSP`);
  }
  for (const path of ["/studio", "/studio/desk", "/studio/structure/post"]) {
    assert.doesNotMatch(path, pattern, `${path} is exempt`);
  }

  const app = flatten([appRule]);
  assert.equal(app["X-Frame-Options"], "DENY");
  assert.match(app["Content-Security-Policy"], /frame-ancestors 'none'/);
});

test("production CSP is strict where it matters and allows the known hosts", () => {
  const script = `
    import cfg from "./next.config.ts";
    const rules = await cfg.headers();
    const csp = rules.flatMap(r => r.headers).find(h => h.key === "Content-Security-Policy").value;
    process.stdout.write(csp);
  `;
  const csp = execFileSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", script],
    { cwd: new URL("../..", import.meta.url), env: { ...process.env, NODE_ENV: "production" }, encoding: "utf8" },
  );
  const directive = (name) => csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

  assert.ok(!directive("script-src").includes("'unsafe-eval'"), "no eval in production");
  assert.match(directive("script-src"), /https:\/\/www\.googletagmanager\.com/);
  assert.match(directive("connect-src"), /google-analytics\.com/);
  assert.match(directive("connect-src"), /\*\.sanity\.io/);
  assert.ok(!/ws:/.test(directive("connect-src")), "no dev websocket in production");
  assert.match(directive("img-src"), /cdn\.sanity\.io/);
  assert.match(directive("frame-src"), /youtube-nocookie\.com/);
  assert.match(directive("frame-src"), /player\.vimeo\.com/);
  assert.match(directive("form-action"), /accounts\.google\.com/);
  assert.equal(directive("object-src"), "object-src 'none'");
  assert.match(csp, /upgrade-insecure-requests/);
  // Valid syntax: every directive is `name value…`, no empty segments.
  for (const d of csp.split("; ")) assert.match(d, /^[a-z-]+( .+)?$/, d);
});
