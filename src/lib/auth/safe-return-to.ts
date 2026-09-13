const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
const LEADING_SCHEME = /^\/?[a-z][a-z0-9+.-]*:/i;

function isSafePathLayer(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || CONTROL_CHARACTERS.test(value)) return false;
  if (LEADING_SCHEME.test(value)) return false;
  return true;
}

export function safeReturnTo(
  value: string | null | undefined,
  fallback = "/",
): string {
  const safeFallback =
    fallback === "/" ? "/" : safeReturnTo(fallback, "/");
  if (!value || !isSafePathLayer(value)) return safeFallback;

  let decoded = value;
  for (let index = 0; index < 5; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (!isSafePathLayer(next)) return safeFallback;
      if (next === decoded) return value;
      decoded = next;
    } catch {
      return safeFallback;
    }
  }

  // Reject values that remain multiply encoded after the validation budget.
  return safeFallback;
}
