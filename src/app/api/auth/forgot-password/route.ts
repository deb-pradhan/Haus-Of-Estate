import { NextResponse } from "next/server";
import { authDb } from "@/lib/auth/auth-db";
import {
  activateIssuedActionToken,
  issueActionToken,
} from "@/lib/auth/action-tokens";
import {
  GENERIC_PASSWORD_RESET_MESSAGE,
  botChallengeFailureResponse,
  logAuthFailure,
  originRejectedResponse,
  rateLimitedResponse,
  readJson,
  validationResponse,
} from "@/lib/auth/api-response";
import { emailActionSchema } from "@/lib/auth/contracts";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import {
  enforceAuthIdentifierThrottle,
  enforceAuthIpThrottle,
} from "@/lib/auth/throttle";
import { settlePublicAuthResponse } from "@/lib/auth/public-response-timing";
import { sendPasswordResetEmail } from "@/lib/email/auth";
import { verifyBotChallenge } from "@/lib/bot-protection/verify";

export const runtime = "nodejs";

const genericResponse = () =>
  NextResponse.json({ ok: true, message: GENERIC_PASSWORD_RESET_MESSAGE });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return originRejectedResponse();

  const parsed = emailActionSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationResponse(parsed.error);
  const startedAt = Date.now();

  try {
    const ipThrottle = await enforceAuthIpThrottle(request, {
      scope: "FORGOT_PASSWORD",
      rule: { limit: 10, windowMs: 15 * 60 * 1_000 },
    });
    if (!ipThrottle.allowed) {
      return rateLimitedResponse(ipThrottle.retryAfterSeconds);
    }

    const challenge = await verifyBotChallenge({
      request,
      token: parsed.data.turnstileToken,
      action: "forgot_password",
    });
    if (!challenge.ok) return botChallengeFailureResponse(challenge);

    const emailThrottle = await enforceAuthIdentifierThrottle({
      scope: "FORGOT_PASSWORD",
      identifier: { kind: "email", value: parsed.data.email },
      rule: { limit: 3, windowMs: 60 * 60 * 1_000 },
    });
    if (!emailThrottle.allowed) {
      return rateLimitedResponse(emailThrottle.retryAfterSeconds);
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
