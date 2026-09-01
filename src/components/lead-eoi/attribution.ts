import type { LeadSurface } from "./types";

const ATTRIBUTION_STORAGE_KEY = "haus_lead_attribution_v1";
interface StoredAttribution {
  pagePath: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

function clean(value: string | null, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function getCurrentAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;

  const search = new URLSearchParams(window.location.search);
  const attribution: StoredAttribution = {
    pagePath: window.location.pathname.slice(0, 500),
    referrer: clean(document.referrer, 1_000),
    utmSource: clean(search.get("utm_source"), 100),
    utmMedium: clean(search.get("utm_medium"), 100),
    utmCampaign: clean(search.get("utm_campaign"), 150),
    utmContent: clean(search.get("utm_content"), 150),
    utmTerm: clean(search.get("utm_term"), 150),
  };

  const hasCampaign = Boolean(
    attribution.utmSource ||
      attribution.utmMedium ||
      attribution.utmCampaign ||
      attribution.utmContent ||
      attribution.utmTerm,
  );

  return hasCampaign ? attribution : null;
}

function readStoredAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return value ? (JSON.parse(value) as StoredAttribution) : null;
  } catch {
    return null;
  }
}

export function primeLeadAttribution() {
  const current = getCurrentAttribution();
  if (!current || typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(current),
    );
  } catch {
    // Storage may be unavailable in private browsing; submission still works.
  }
}

export function getLeadAttribution(surface: LeadSurface) {
  if (typeof window === "undefined") {
    return { surface, pagePath: "/" };
  }

  const current = getCurrentAttribution();
  if (current) {
    try {
      window.sessionStorage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(current),
      );
    } catch {
      // Continue with in-memory values.
    }
  }

  const attribution = current ?? readStoredAttribution();

  return {
    surface,
    pagePath: attribution?.pagePath ?? window.location.pathname.slice(0, 500),
    referrer: attribution?.referrer,
    utmSource: attribution?.utmSource,
    utmMedium: attribution?.utmMedium,
    utmCampaign: attribution?.utmCampaign,
    utmContent: attribution?.utmContent,
    utmTerm: attribution?.utmTerm,
  };
}
