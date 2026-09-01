import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import type { BotChallengeResult } from "@/lib/bot-protection/types";

export const GENERIC_VERIFICATION_MESSAGE =
  "If an account needs verification, we will send instructions to that email address.";
export const GENERIC_PASSWORD_RESET_MESSAGE =
  "If an account exists for that email address, we will send password reset instructions.";

export function validationResponse(error: ZodError) {
  return NextResponse.json(
    {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}

export function originRejectedResponse() {
  return NextResponse.json(
    { ok: false, error: "This request is not allowed." },
    { status: 403 },
  );
}

export function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { ok: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export function infrastructureFailureResponse() {
  return NextResponse.json(
    { ok: false, error: "This service is temporarily unavailable." },
    { status: 503 },
  );
}

export function botChallengeFailureResponse(
  result: Extract<BotChallengeResult, { ok: false }>,
) {
  if (result.reason === "unavailable") {
    return NextResponse.json(
      {
        ok: false,
        code: "BOT_CHALLENGE_UNAVAILABLE",
        error: "Security verification is temporarily unavailable.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      code:
        result.reason === "missing"
          ? "BOT_CHALLENGE_REQUIRED"
          : "BOT_CHALLENGE_REJECTED",
      error: "Complete the security check and try again.",
    },
    { status: result.reason === "missing" ? 400 : 403 },
  );
}

export function logAuthFailure(event: string, error: unknown): void {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "UNCLASSIFIED";
  console.error(event, { code });
}

export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
