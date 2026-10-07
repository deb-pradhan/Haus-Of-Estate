export const HAUS_SITE_ORIGIN = "https://hausofestate.com";

export interface SharePayload {
  url: string;
  title: string;
  text?: string;
}

export interface ShareIntentLink {
  id: "whatsapp" | "email" | "facebook" | "linkedin" | "x" | "pinterest";
  name: string;
  href: string;
}

export function canonicalHausUrl(pathOrUrl: string): string {
  const url = new URL(pathOrUrl, HAUS_SITE_ORIGIN);
  if (url.origin !== HAUS_SITE_ORIGIN) {
    throw new Error("Share URLs must use the Haus of Estate canonical origin");
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function buildShareIntentLinks({
  url,
  title,
  text,
}: SharePayload): ShareIntentLink[] {
  const canonicalUrl = canonicalHausUrl(url);
  const shareText = text?.trim() || title.trim();
  const encodedUrl = encodeURIComponent(canonicalUrl);
  const encodedTitle = encodeURIComponent(title.trim());
  const encodedText = encodeURIComponent(shareText);
  const encodedMessage = encodeURIComponent(`${shareText} ${canonicalUrl}`);
  const encodedEmailBody = encodeURIComponent(`${shareText}\n\n${canonicalUrl}`);

  return [
    {
      id: "whatsapp",
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedMessage}`,
    },
    {
      id: "email",
      name: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedEmailBody}`,
    },
    {
      id: "facebook",
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      id: "x",
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      id: "pinterest",
      name: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
    },
  ];
}
