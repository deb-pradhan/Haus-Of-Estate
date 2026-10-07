import { Resend } from "resend";
import { AuthConfigurationError } from "@/lib/auth/errors";
import { safeReturnTo } from "@/lib/auth/safe-return-to";

let authEmailClient: Resend | null = null;

function getAuthEmailClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_xxx") {
    if (process.env.NODE_ENV === "production") {
      throw new AuthConfigurationError("AUTH_EMAIL_PROVIDER_MISSING");
    }
    return null;
  }
  authEmailClient ??= new Resend(apiKey);
  return authEmailClient;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL;
  const production = process.env.NODE_ENV === "production";
  if (!configured && production) {
    throw new AuthConfigurationError("AUTH_SITE_URL_MISSING");
  }
  try {
    const url = new URL(configured ?? "http://localhost:3000");
    if (
      url.protocol === "https:" ||
      (!production && url.protocol === "http:")
    ) {
      return url;
    }
  } catch {
    // The fallback below keeps secrets and malformed values out of user-facing links.
  }
  if (production) {
    throw new AuthConfigurationError("AUTH_SITE_URL_INVALID");
  }
  return new URL("http://localhost:3000");
}

function actionUrl(
  purpose: "email-verification" | "password-reset",
  rawToken: string,
  returnTo?: string,
): string {
  const url = new URL("/api/auth/action-token/exchange", siteUrl());
  url.searchParams.set("purpose", purpose);
  url.searchParams.set("token", rawToken);
  url.searchParams.set("returnTo", safeReturnTo(returnTo, "/auth/login"));
  return url.toString();
}

function assertEmailAccepted(result: {
  error?: { message?: string } | null;
}): void {
  if (result.error) {
    throw new AuthConfigurationError("AUTH_EMAIL_DELIVERY_REJECTED");
  }
}

export async function sendVerificationEmail(input: {
  to: string;
  name: string;
  rawToken: string;
  returnTo?: string;
}) {
  const client = getAuthEmailClient();
  if (!client) return { success: true, mock: true };
  const verifyUrl = actionUrl(
    "email-verification",
    input.rawToken,
    input.returnTo,
  );
  const result = await client.emails.send({
    from:
      process.env.AUTH_EMAIL_FROM ??
      "Haus of Estate <noreply@hausofestate.com>",
    to: input.to,
    subject: "Verify your Haus of Estate email",
    html: `<p>Hi ${escapeHtml(input.name)},</p>
<p>Verify your email address to finish securing your Haus of Estate account.</p>
<p><a href="${escapeHtml(verifyUrl)}">Verify email address</a></p>
<p>This link expires in 24 hours. If you did not request this account, you can ignore this email.</p>`,
  });
  assertEmailAccepted(result);
  return result;
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  rawToken: string;
  returnTo?: string;
}) {
  const client = getAuthEmailClient();
  if (!client) return { success: true, mock: true };
  const resetUrl = actionUrl(
    "password-reset",
    input.rawToken,
    input.returnTo,
  );
  const result = await client.emails.send({
    from:
      process.env.AUTH_EMAIL_FROM ??
      "Haus of Estate <noreply@hausofestate.com>",
    to: input.to,
    subject: "Reset your Haus of Estate password",
    html: `<p>Hi ${escapeHtml(input.name)},</p>
<p>Use the secure link below to choose a new password.</p>
<p><a href="${escapeHtml(resetUrl)}">Reset password</a></p>
<p>This link expires in one hour. If you did not request a reset, you can ignore this email.</p>`,
  });
  assertEmailAccepted(result);
  return result;
}
