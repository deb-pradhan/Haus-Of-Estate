export const BOT_PROTECTION_ACTIONS = [
  "register",
  "forgot_password",
  "resend_verification",
] as const;

export type BotProtectionAction = (typeof BOT_PROTECTION_ACTIONS)[number];

export type BotProtectionClientConfig =
  | { enabled: false }
  | { enabled: true; siteKey: string | null };

export type BotChallengeResult =
  | { ok: true; skipped: boolean }
  | {
      ok: false;
      reason: "missing" | "rejected" | "unavailable";
    };
