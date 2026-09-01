import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { isSavedContentEnabled } from "@/lib/features";

const ALWAYS_PROTECTED_PATHS = ["/account", "/messages", "/viewings"];
const GUEST_ONLY_PATHS = ["/auth/login", "/auth/register"];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export default auth((request) => {
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
});

export const config = {
  matcher: [
    "/saved/:path*",
    "/account/:path*",
    "/messages/:path*",
    "/viewings/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
