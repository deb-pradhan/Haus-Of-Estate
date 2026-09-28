export interface SnaggingBookingConfig {
  bookingUrl: string;
  embedUrl?: string;
}

function publicHttpsUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

// These are public booking-page links, never calendar API or OAuth credentials.
export function readSnaggingBookingConfig(
  environment: Record<string, string | undefined> = process.env,
): SnaggingBookingConfig | null {
  if (environment.SNAGGING_BOOKING_ENABLED !== "true") return null;
  const bookingUrl = publicHttpsUrl(environment.SNAGGING_BOOKING_URL);
  if (!bookingUrl) return null;
  const embedUrl = publicHttpsUrl(environment.SNAGGING_BOOKING_EMBED_URL);
  return { bookingUrl, ...(embedUrl ? { embedUrl } : {}) };
}
