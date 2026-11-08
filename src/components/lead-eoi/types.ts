export type LeadInterest =
  | "general_enquiry"
  | "buy"
  | "rent"
  | "invest"
  | "sell_let"
  | "newsletter_only";

export type LeadSurface =
  | "query_page"
  | "modal"
  | "manual_cta"
  | "newsletter"
  | "register_interest"
  | "launch_article";

export interface LeadProjectContext {
  slug: string;
  title?: string;
  community?: string;
  masterDevelopment?: string;
  city?: string;
  country?: string;
  unitType?: string;
  bedrooms?: number;
  bathrooms?: number;
  listingType?: string[];
}

/** A developer launch from the code allowlist; no published property exists yet. */
export interface LeadLaunchContext {
  key: string;
  title: string;
  developer?: string;
  community?: string;
  city?: string;
  country?: string;
  /** Reported options offered as choices, never asserted as inventory. */
  unitTypes?: readonly string[];
  bedrooms?: readonly string[];
  qualification?: string;
}

export interface LeadInitialPreferences {
  market?: string;
  location?: string;
  bedrooms?: string;
}

export interface LeadBrochureRequest {
  design?: { id: string; label: string };
  /** The selected design has no collection brochure mapping yet: the form sends an enquiry instead. */
  emailUnavailable?: boolean;
}

export interface LeadOpenOptions {
  interest?: LeadInterest;
  email?: string;
  project?: LeadProjectContext;
  launchInterest?: LeadLaunchContext;
  initialPreferences?: LeadInitialPreferences;
  brochureRequest?: LeadBrochureRequest;
  surface?: LeadSurface;
}

export interface LeadFormRequest extends LeadOpenOptions {
  instanceId: string;
  surface: LeadSurface;
}
