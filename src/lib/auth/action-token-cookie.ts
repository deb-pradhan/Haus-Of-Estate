import type { NextResponse } from "next/server";

export type ActionTokenPurpose = "email-verification" | "password-reset";

const COOKIE_NAMES: Record<ActionTokenPurpose, string> = {
  "email-verification": "__Host-haus-email-verification",
  "password-reset": "__Host-haus-password-reset",
};

export function actionTokenCookieName(purpose: ActionTokenPurpose) {
  return COOKIE_NAMES[purpose];
}

export function setActionTokenCookie(
  response: NextResponse,
  purpose: ActionTokenPurpose,
  token: string,
) {
  response.cookies.set(actionTokenCookieName(purpose), token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 60,
  });
}

export function clearActionTokenCookie(
  response: NextResponse,
  purpose: ActionTokenPurpose,
) {
  response.cookies.set(actionTokenCookieName(purpose), "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
