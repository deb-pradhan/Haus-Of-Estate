import { safeReturnTo } from "@/lib/auth/safe-return-to";

export function callbackCookieReturnTo(
  value: string | undefined,
  configuredOrigin: string | undefined,
) {
  if (!value) return "/";
  if (value.startsWith("/")) return safeReturnTo(value, "/");

  try {
    const target = new URL(value);
    const origin = new URL(
      configuredOrigin ?? "http://localhost:3000",
    ).origin;
    if (target.origin !== origin) return "/";
    return safeReturnTo(`${target.pathname}${target.search}${target.hash}`, "/");
  } catch {
    return "/";
  }
}
