import { z } from "zod";

export interface ResendEnvironment {
  [key: string]: string | undefined;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}

/** Shared careers/lead sender configuration; hosted domain verification is a separate check. */
export function readResendSettings(
  environment: ResendEnvironment = process.env,
): {
  apiKey: string;
  fromEmail: string;
} {
  const apiKey = environment.RESEND_API_KEY?.trim() ?? "";
  if (!apiKey || apiKey === "re_xxx" || /\s/.test(apiKey)) {
    throw new Error("RESEND_API_KEY must be a configured bare API key");
  }
  const fromEmail = (
    environment.RESEND_FROM_EMAIL?.trim() || "noreply@hausofestate.com"
  ).toLowerCase();
  if (
    !z.email().safeParse(fromEmail).success ||
    !fromEmail.endsWith("@hausofestate.com")
  ) {
    throw new Error(
      "RESEND_FROM_EMAIL must be one @hausofestate.com email address",
    );
  }
  return { apiKey, fromEmail };
}
