/**
 * Consent contract shared by /api/leads, /api/funnel and /api/auth/register.
 *
 * Request body fields:
 *   consentNotice    true  REQUIRED. The person saw the privacy notice before submitting.
 *   marketingConsent boolean, default false. Optional, separate, unticked by default.
 *   marketingChannels string[]  only honoured when marketingConsent is true.
 *   consentGiven     true  LEGACY alias for consentNotice. Never implies marketing consent.
 */
export { CONSENT_TEXT_VERSION } from "@/lib/site-claims";

const ALLOWED_MARKETING_CHANNELS = ["email", "sms", "whatsapp", "phone"] as const;
export type MarketingChannel = (typeof ALLOWED_MARKETING_CHANNELS)[number];

export interface ParsedConsent {
  /** Privacy notice acknowledged (this is not marketing consent). */
  notice: boolean;
  /** Explicit, optional marketing opt-in. */
  marketing: boolean;
  marketingChannels: MarketingChannel[];
}

export function parseConsent(body: Record<string, unknown>): ParsedConsent {
  const notice = body.consentNotice === true || body.consentGiven === true;
  // Marketing must be an explicit boolean true. The legacy field never counts.
  const marketing = notice && body.marketingConsent === true;

  let channels: MarketingChannel[] = [];
  if (marketing) {
    const raw = Array.isArray(body.marketingChannels) ? body.marketingChannels : [];
    channels = Array.from(
      new Set(
        raw.filter((c): c is MarketingChannel =>
          (ALLOWED_MARKETING_CHANNELS as readonly string[]).includes(c as string),
        ),
      ),
    );
    if (channels.length === 0) channels = ["email"];
  }

  return { notice, marketing, marketingChannels: channels };
}
