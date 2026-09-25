import { NextResponse } from "next/server";
import { authUnavailableResponse } from "@/lib/auth/availability";
import { isAuthEnabled } from "@/lib/features";
import { verifyEmailSchema } from "@/lib/auth/contracts";
import {
  type ActionTokenPurpose,
  setActionTokenCookie,
} from "@/lib/auth/action-token-cookie";
import { safeReturnTo } from "@/lib/auth/safe-return-to";

export const runtime = "nodejs";

const DESTINATIONS: Record<ActionTokenPurpose, string> = {
  "email-verification": "/auth/verify-email",
  "password-reset": "/auth/reset-password",
};

function redirectResponse(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: location,
      "Referrer-Policy": "no-referrer",
    },
  });
}

export function GET(request: Request) {
  if (!isAuthEnabled()) return authUnavailableResponse();
  const requestUrl = new URL(request.url);
  const purpose = requestUrl.searchParams.get("purpose") as ActionTokenPurpose;
  const destination = DESTINATIONS[purpose];
  if (!destination) {
    return new NextResponse(null, { status: 404 });
  }

  const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo"), "/");
  const cleanParams = new URLSearchParams({ returnTo });
  const parsed = verifyEmailSchema.safeParse({
    token: requestUrl.searchParams.get("token"),
  });
  if (!parsed.success) {
    cleanParams.set("invalid", "1");
    return redirectResponse(`${destination}?${cleanParams.toString()}`);
  }

  cleanParams.set("ready", "1");
  const response = redirectResponse(
    `${destination}?${cleanParams.toString()}`,
  );
  setActionTokenCookie(response, purpose, parsed.data.token);
  return response;
}
