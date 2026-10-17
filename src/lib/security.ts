/**
 * Small, dependency-free input hygiene helpers for API routes.
 *
 * Deliberately self-contained (no imports) so it can be unit-tested with
 * `node --experimental-strip-types` and reused from any runtime.
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

/** Escape a value for safe interpolation into HTML text or a quoted attribute. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"'`]/g, (c) => HTML_ESCAPES[c]);
}

// Practical RFC 5322 subset: one @, no spaces, a dot in the domain, sane length.
const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

/** True when `value` is a string that looks like a deliverable email address. */
export function isEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length < 6 || value.length > 254) return false;
  const [local] = value.split("@");
  if (!local || local.length > 64) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return false;
  }
  return EMAIL_RE.test(value);
}

/** Lower-case + trim an email so look-ups and unique constraints are consistent. */
export function normaliseEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Coerce an untrusted value to a trimmed string of at most `max` characters.
 * Non-strings (objects, arrays, numbers) become "" so they can never reach a
 * database filter as an operator object. Control characters are stripped.
 */
export function clampString(value: unknown, max = 200): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS_RE, "").trim().slice(0, Math.max(0, max));
}

/** Strip CR/LF so a value can never inject extra headers (e.g. email subjects). */
export function singleLine(value: unknown, max = 200): string {
  return clampString(value, max * 2).replace(/[\r\n\u2028\u2029]+/g, " ").slice(0, max);
}

/** Return `value` only if it is one of `allowed`, else `fallback`. */
export function pickEnum<const T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Only allow same-site relative redirect targets (blocks `//evil.com`,
 * `/\evil.com`, `https://evil.com`, `javascript:`). Returns `fallback` otherwise.
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;
  return value;
}

/** Length-safe, constant-time string comparison (no `crypto` import needed). */
export function safeEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
