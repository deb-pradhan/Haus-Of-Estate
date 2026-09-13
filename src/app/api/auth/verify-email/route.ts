import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyEmailWithToken } from "@/lib/auth/action-tokens";
import {
  actionTokenCookieName,
  clearActionTokenCookie,
} from "@/lib/auth/action-token-cookie";
import {
  infrastructureFailureResponse,
  logAuthFailure,
  originRejectedResponse,
  rateLimitedResponse,
  readJson,
  validationResponse,
} from "@/lib/auth/api-response";
import { verifyEmailSchema } from "@/lib/auth/contracts";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { enforceAuthThrottle } from "@/lib/auth/throttle";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return originRejectedResponse();

  const body = await readJson(request);
  const cookieToken = (await cookies()).get(
    actionTokenCookieName("email-verification"),
  )?.value;
  const parsed = verifyEmailSchema.safeParse({
    ...(typeof body === "object" && body !== null ? body : {}),
    token:
      typeof body === "object" &&
      body !== null &&
      "token" in body &&
      typeof body.token === "string"
        ? body.token
        : cookieToken,
  });
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const throttle = await enforceAuthThrottle(request, {
      scope: "VERIFY_EMAIL",
      identifier: { kind: "token", value: parsed.data.token },
      ip: { limit: 20, windowMs: 15 * 60 * 1_000 },
      identifierRule: { limit: 5, windowMs: 15 * 60 * 1_000 },
    });
    if (!throttle.allowed) {
      return rateLimitedResponse(throttle.retryAfterSeconds);
    }

    const verified = await verifyEmailWithToken(parsed.data.token);
    if (!verified) {
      return clearActionTokenCookie(NextResponse.json(
        {
          ok: false,
          error: "This verification link is invalid or has expired.",
        },
        { status: 400 },
      ), "email-verification");
    }

    return clearActionTokenCookie(
      NextResponse.json({ ok: true }),
      "email-verification",
    );
  } catch (error) {
    logAuthFailure("Auth email verification failed", error);
    return infrastructureFailureResponse();
  }
}
