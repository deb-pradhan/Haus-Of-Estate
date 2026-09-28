export const SOCIAL_PROFILES = [
  {
    id: "instagram",
    name: "Instagram",
    href: "https://www.instagram.com/haus_of_estate/",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/115804984/",
  },
  {
    id: "facebook",
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61560983191278",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    href: "https://in.pinterest.com/hausofestate/",
  },
  {
    id: "youtube",
    name: "YouTube",
    href: "https://www.youtube.com/@Hausofestate",
  },
  { id: "x", name: "X", href: "https://x.com/hausofestate" },
] as const;

export const SOCIAL_PROFILE_URLS = SOCIAL_PROFILES.map(
  (profile) => profile.href,
);

export type SocialProfileId = (typeof SOCIAL_PROFILES)[number]["id"];
