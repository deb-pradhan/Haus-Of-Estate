import { NextResponse } from "next/server";
import { authDb } from "@/lib/auth/auth-db";
import {
  activateIssuedActionToken,
  issueActionToken,
} from "@/lib/auth/action-tokens";
import {
  GENERIC_PASSWORD_RESET_MESSAGE,
  logAuthFailure,
  originRejectedResponse,
  rateLimitedResponse,
  readJson,
  validationResponse,
} from "@/lib/auth/api-response";
import { emailActionSchema } from "@/lib/auth/contracts";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { enforceAuthThrottle } from "@/lib/auth/throttle";
import { settlePublicAuthResponse } from "@/lib/auth/public-response-timing";
import { sendPasswordResetEmail } from "@/lib/email/auth";

export const runtime = "nodejs";

const genericResponse = () =>
  NextResponse.json({ ok: true, message: GENERIC_PASSWORD_RESET_MESSAGE });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return originRejectedResponse();

  const parsed = emailActionSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationResponse(parsed.error);
  const startedAt = Date.now();

  try {
    const throttle = await enforceAuthThrottle(request, {
      scope: "FORGOT_PASSWORD",
      identifier: { kind: "email", value: parsed.data.email },
      ip: { limit: 10, windowMs: 15 * 60 * 1_000 },
      identifierRule: { limit: 3, windowMs: 60 * 60 * 1_000 },
    });
    if (!throttle.allowed) {
      return rateLimitedResponse(throttle.retryAfterSeconds);
    }

    const user = await authDb.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (user && !user.disabledAt) {
      const rawToken = await issueActionToken(user.id, "PASSWORD_RESET");
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? "there",
        rawToken,
        returnTo: parsed.data.returnTo,
      });
      await activateIssuedActionToken(
        user.id,
        "PASSWORD_RESET",
        rawToken,
      );
    }
  } catch (error) {
    // Keep the public result enumeration-safe even when downstream delivery fails.
    logAuthFailure("Auth password reset request failed", error);
  }

  await settlePublicAuthResponse(startedAt);
  return genericResponse();
}
