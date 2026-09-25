import { NextResponse } from "next/server";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { authPageUnavailableResponse, isAuthPath } from "@/lib/auth/availability";
import { isAuthEnabled, isSavedContentEnabled } from "@/lib/features";
import { isApprovedCareersPath } from "@/lib/career-roles";
import {
  CAREERS_PUBLIC_ENABLED,
  careersUnavailableResponse,
  isCareersPath,
} from "@/lib/careers-availability";

const ALWAYS_PROTECTED_PATHS = ["/account", "/messages", "/viewings"];
const GUEST_ONLY_PATHS = ["/auth/login", "/auth/register"];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

// Give Auth.js the middleware overload, rather than its App Router handler overload.
const handleAuthenticatedRequest: (
  request: NextAuthRequest,
  event: NextFetchEvent,
) => ReturnType<NextMiddleware> = (request) => {
  const { pathname, search } = request.nextUrl;
  const signedIn = Boolean(request.auth?.user?.id);

  const protectedPaths = isSavedContentEnabled()
    ? ["/saved", ...ALWAYS_PROTECTED_PATHS]
    : ALWAYS_PROTECTED_PATHS;

  if (!signedIn && matches(pathname, protectedPaths)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (signedIn && matches(pathname, GUEST_ONLY_PATHS)) {
    const returnTo = safeReturnTo(
      request.nextUrl.searchParams.get("returnTo"),
      "/",
    );
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  return NextResponse.next();
};
export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (!isAuthEnabled() && isAuthPath(pathname)) {
    return authPageUnavailableResponse();
  }

  // Respond before any page/RSC output or cached job metadata can be served.
  if (isCareersPath(pathname) && (!CAREERS_PUBLIC_ENABLED || !isApprovedCareersPath(pathname))) {
    return careersUnavailableResponse();
  }

  // Keep session handling limited to the routes covered by Release 2's auth proxy.
  if (matches(pathname, ["/saved", ...ALWAYS_PROTECTED_PATHS, ...GUEST_ONLY_PATHS])) {
    const { auth } = await import("@/auth");
    const authenticatedProxy = auth(handleAuthenticatedRequest);
    return authenticatedProxy(request, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
