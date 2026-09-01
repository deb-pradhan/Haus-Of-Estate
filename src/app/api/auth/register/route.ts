import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/contracts";
import { authDb } from "@/lib/auth/auth-db";
import { createUnverifiedUserWithToken } from "@/lib/auth/action-tokens";
import {
  GENERIC_VERIFICATION_MESSAGE,
  botChallengeFailureResponse,
  infrastructureFailureResponse,
  logAuthFailure,
  originRejectedResponse,
  rateLimitedResponse,
  readJson,
  validationResponse,
} from "@/lib/auth/api-response";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import {
  enforceAuthIdentifierThrottle,
  enforceAuthIpThrottle,
} from "@/lib/auth/throttle";
import { settlePublicAuthResponse } from "@/lib/auth/public-response-timing";
import { sendVerificationEmail } from "@/lib/email/auth";
import { verifyBotChallenge } from "@/lib/bot-protection/verify";

export const runtime = "nodejs";

const TEN_MINUTES = 10 * 60 * 1_000;
const ONE_HOUR = 60 * 60 * 1_000;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function deliverVerification(input: {
  email: string;
  name: string;
  rawToken: string;
  returnTo?: string;
}) {
  try {
    await sendVerificationEmail({
      to: input.email,
      name: input.name,
      rawToken: input.rawToken,
      returnTo: input.returnTo,
    });
  } catch (error) {
    logAuthFailure("Auth verification email delivery failed", error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return originRejectedResponse();

  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationResponse(parsed.error);
  const startedAt = Date.now();

  try {
    const ipThrottle = await enforceAuthIpThrottle(request, {
      scope: "REGISTER",
      rule: { limit: 10, windowMs: TEN_MINUTES },
    });
    if (!ipThrottle.allowed) {
      return rateLimitedResponse(ipThrottle.retryAfterSeconds);
    }

    const challenge = await verifyBotChallenge({
      request,
      token: parsed.data.turnstileToken,
      action: "register",
    });
    if (!challenge.ok) return botChallengeFailureResponse(challenge);

    const emailThrottle = await enforceAuthIdentifierThrottle({
      scope: "REGISTER",
      identifier: { kind: "email", value: parsed.data.email },
      rule: { limit: 5, windowMs: ONE_HOUR },
    });
    if (!emailThrottle.allowed) {
      return rateLimitedResponse(emailThrottle.retryAfterSeconds);
    }

    // Throttling deliberately happens before this CPU-intensive operation.
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const existing = await authDb.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!existing) {
      try {
        const created = await createUnverifiedUserWithToken({
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          passwordHash,
        });
        await deliverVerification({
          email: parsed.data.email,
          name: parsed.data.name,
          rawToken: created.rawToken,
          returnTo: parsed.data.returnTo,
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
      }
    }

    await settlePublicAuthResponse(startedAt);
    return NextResponse.json(
      { ok: true, message: GENERIC_VERIFICATION_MESSAGE },
      { status: 202 },
    );
  } catch (error) {
    logAuthFailure("Auth registration failed", error);
    return infrastructureFailureResponse();
  }
}
