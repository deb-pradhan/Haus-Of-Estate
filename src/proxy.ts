import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CAREERS_PUBLIC_ENABLED,
  careersUnavailableResponse,
  isCareersPath,
} from "@/lib/careers-availability";

const GUEST_ONLY = ["/auth/login", "/auth/register"];

// Auth.js v5 session cookie: `authjs.session-token` (http/dev) or
// `__Secure-authjs.session-token` (https). Large JWTs are chunked as `.0`, `.1`…
// A cookie's presence is only a UX hint (guests-only pages bounce signed-in
// users); it is NOT an authorisation check. Real checks must call `auth()`.
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) =>
      /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/.test(name)
    );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Respond before any page/RSC output or cached job metadata can be served.
  if (!CAREERS_PUBLIC_ENABLED && isCareersPath(pathname)) {
    return careersUnavailableResponse();
  }

  if (GUEST_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (hasSessionCookie(request)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
