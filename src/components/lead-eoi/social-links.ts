const REGISTER_INTEREST_URL = "https://hausofestate.com/register-interest";

const SOCIAL_SOURCES = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "youtube",
  "pinterest",
] as const;

export type LeadSocialSource = (typeof SOCIAL_SOURCES)[number];

export const LEAD_SOCIAL_LINKS = Object.fromEntries(
  SOCIAL_SOURCES.map((source) => {
    const params = new URLSearchParams({
      utm_source: source,
      utm_medium: "organic_social",
      utm_campaign: "bio",
    });

    return [source, `${REGISTER_INTEREST_URL}?${params.toString()}`];
  }),
) as Record<LeadSocialSource, string>;
