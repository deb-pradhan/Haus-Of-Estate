import assert from "node:assert/strict";
import test from "node:test";
import {
  clampString,
  escapeHtml,
  isEmail,
  normaliseEmail,
  pickEnum,
  safeEqual,
  safeRedirectPath,
  singleLine,
} from "../../src/lib/security.ts";

test("escapeHtml neutralises markup and attribute breakouts", () => {
  assert.equal(
    escapeHtml(`<a href="x" onclick='y'>&</a>`),
    "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
  );
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
  assert.equal(escapeHtml(42), "42");
  assert.ok(!escapeHtml("<script>alert(1)</script>").includes("<"));
});

test("isEmail accepts normal addresses and rejects junk", () => {
  for (const ok of ["a@b.co", "first.last+tag@example.co.uk", "x_y@sub.domain.org"]) {
    assert.equal(isEmail(ok), true, ok);
  }
  for (const bad of [
    "",
    "plain",
    "a@b",
    "a b@c.com",
    "@c.com",
    "a@.com",
    ".a@c.com",
    "a..b@c.com",
    "a@c..com",
    `${"x".repeat(65)}@example.com`,
    `a@${"d".repeat(250)}.com`,
    { contains: "" },
    ["a@b.co"],
    null,
    undefined,
    12345,
  ]) {
    assert.equal(isEmail(bad), false, JSON.stringify(bad));
  }
});

test("normaliseEmail trims and lower-cases strings only", () => {
  assert.equal(normaliseEmail("  Foo@Example.COM "), "foo@example.com");
  assert.equal(normaliseEmail({ not: "x" }), "");
});

test("clampString never lets objects through and strips control characters", () => {
  assert.equal(clampString({ contains: "" }), "");
  assert.equal(clampString(["a"]), "");
  assert.equal(clampString(7), "");
  assert.equal(clampString("  hello  "), "hello");
  assert.equal(clampString("a\u0000b\u0007c"), "abc");
  assert.equal(clampString("line1\nline2"), "line1\nline2");
  assert.equal(clampString("x".repeat(10_000), 50).length, 50);
});

test("singleLine collapses CR/LF so values cannot inject header lines", () => {
  const out = singleLine("Hi\r\nBcc: attacker@example.com");
  assert.ok(!/[\r\n]/.test(out));
  assert.equal(singleLine("a b"), "a b");
});

test("pickEnum falls back for anything outside the allow-list", () => {
  const allowed = ["buyer", "seller"];
  assert.equal(pickEnum("buyer", allowed, "buyer"), "buyer");
  assert.equal(pickEnum("admin", allowed, "seller"), "seller");
  assert.equal(pickEnum({ toString: () => "buyer" }, allowed, "seller"), "seller");
});

test("safeRedirectPath only allows same-site relative paths", () => {
  assert.equal(safeRedirectPath("/properties?x=1"), "/properties?x=1");
  for (const bad of [
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    "/ok\nbad",
    `/${"a".repeat(3000)}`,
    undefined,
    { a: 1 },
  ]) {
    assert.equal(safeRedirectPath(bad), "/", JSON.stringify(bad));
  }
  assert.equal(safeRedirectPath("//evil.com", "/home"), "/home");
});

test("safeEqual compares strings in a length-safe way", () => {
  assert.equal(safeEqual("secret-value", "secret-value"), true);
  assert.equal(safeEqual("secret-value", "secret-valuX"), false);
  assert.equal(safeEqual("short", "longer-value"), false);
  assert.equal(safeEqual("", ""), true);
  assert.equal(safeEqual(undefined, "x"), false);
  assert.equal(safeEqual("x", null), false);
});
