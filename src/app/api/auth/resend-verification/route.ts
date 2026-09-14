import { NextResponse } from "next/server";
import { authDb } from "@/lib/auth/auth-db";
import {
  activateIssuedActionToken,
  issueActionToken,
} from "@/lib/auth/action-tokens";
import {
  GENERIC_VERIFICATION_MESSAGE,
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
import { sendVerificationEmail } from "@/lib/email/auth";
import { verifyBotChallenge } from "@/lib/bot-protection/verify";

export const runtime = "nodejs";

const genericResponse = () =>
  NextResponse.json({ ok: true, message: GENERIC_VERIFICATION_MESSAGE });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return originRejectedResponse();

  const parsed = emailActionSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationResponse(parsed.error);
  const startedAt = Date.now();

  try {
    const ipThrottle = await enforceAuthIpThrottle(request, {
      scope: "RESEND_VERIFICATION",
      rule: { limit: 10, windowMs: 15 * 60 * 1_000 },
    });
    if (!ipThrottle.allowed) {
      return rateLimitedResponse(ipThrottle.retryAfterSeconds);
    }

    const challenge = await verifyBotChallenge({
      request,
      token: parsed.data.turnstileToken,
      action: "resend_verification",
    });
    if (!challenge.ok) return botChallengeFailureResponse(challenge);

    const emailThrottle = await enforceAuthIdentifierThrottle({
      scope: "RESEND_VERIFICATION",
      identifier: { kind: "email", value: parsed.data.email },
      rule: { limit: 3, windowMs: 60 * 60 * 1_000 },
    });
    if (!emailThrottle.allowed) {
      return rateLimitedResponse(emailThrottle.retryAfterSeconds);
    }

    const user = await authDb.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (user && !user.disabledAt && user.emailVerified === null) {
      const rawToken = await issueActionToken(user.id, "EMAIL_VERIFICATION");
      await sendVerificationEmail({
        to: user.email,
        name: user.name ?? "there",
        rawToken,
        returnTo: parsed.data.returnTo,
      });
      await activateIssuedActionToken(
        user.id,
        "EMAIL_VERIFICATION",
        rawToken,
      );
    }
  } catch (error) {
    // The response remains identical so account existence cannot be inferred.
    logAuthFailure("Auth verification resend failed", error);
  }

  await settlePublicAuthResponse(startedAt);
  return genericResponse();
}
