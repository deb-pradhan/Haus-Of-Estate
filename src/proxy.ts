import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CAREERS_PUBLIC_ENABLED,
  careersUnavailableResponse,
  isCareersPath,
} from "@/lib/careers-availability";

const GUEST_ONLY = ["/auth/login", "/auth/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Respond before any page/RSC output or cached job metadata can be served.
  if (!CAREERS_PUBLIC_ENABLED && isCareersPath(pathname)) {
    return careersUnavailableResponse();
  }

  if (GUEST_ONLY.some((p) => pathname.startsWith(p))) {
    const sessionCookie =
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
