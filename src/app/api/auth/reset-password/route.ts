import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resetPasswordWithToken } from "@/lib/auth/action-tokens";
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
import { resetPasswordSchema } from "@/lib/auth/contracts";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { enforceAuthThrottle } from "@/lib/auth/throttle";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return originRejectedResponse();

  const body = await readJson(request);
  const cookieToken = (await cookies()).get(
    actionTokenCookieName("password-reset"),
  )?.value;
  const parsed = resetPasswordSchema.safeParse({
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
      scope: "RESET_PASSWORD",
      identifier: { kind: "token", value: parsed.data.token },
      ip: { limit: 10, windowMs: 15 * 60 * 1_000 },
      identifierRule: { limit: 5, windowMs: 15 * 60 * 1_000 },
    });
    if (!throttle.allowed) {
      return rateLimitedResponse(throttle.retryAfterSeconds);
    }

    // Throttling deliberately happens before this CPU-intensive operation.
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const reset = await resetPasswordWithToken(
      parsed.data.token,
      passwordHash,
    );
    if (!reset) {
      return clearActionTokenCookie(NextResponse.json(
        {
          ok: false,
          error: "This reset link is invalid or has expired.",
        },
        { status: 400 },
      ), "password-reset");
    }

    return clearActionTokenCookie(
      NextResponse.json({
        ok: true,
        message: "Your password has been reset. Please sign in again.",
      }),
      "password-reset",
    );
  } catch (error) {
    logAuthFailure("Auth password reset failed", error);
    return infrastructureFailureResponse();
  }
}
