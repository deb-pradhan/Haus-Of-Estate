import { NextResponse } from "next/server";
import { authDb } from "@/lib/auth/auth-db";
import {
  activateIssuedActionToken,
  issueActionToken,
} from "@/lib/auth/action-tokens";
import {
  GENERIC_VERIFICATION_MESSAGE,
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
import { sendVerificationEmail } from "@/lib/email/auth";

export const runtime = "nodejs";

const genericResponse = () =>
  NextResponse.json({ ok: true, message: GENERIC_VERIFICATION_MESSAGE });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return originRejectedResponse();

  const parsed = emailActionSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationResponse(parsed.error);
  const startedAt = Date.now();

  try {
    const throttle = await enforceAuthThrottle(request, {
      scope: "RESEND_VERIFICATION",
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
