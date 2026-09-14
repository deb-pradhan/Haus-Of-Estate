export type LeadInterest =
  | "buy"
  | "rent"
  | "invest"
  | "sell_let"
  | "newsletter_only";

export type LeadSurface =
  | "modal"
  | "manual_cta"
  | "newsletter"
  | "register_interest";

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

export interface LeadInitialPreferences {
  market?: string;
  location?: string;
  bedrooms?: string;
}

export interface LeadOpenOptions {
  interest?: LeadInterest;
  email?: string;
  project?: LeadProjectContext;
  initialPreferences?: LeadInitialPreferences;
  surface?: LeadSurface;
}

export interface LeadFormRequest extends LeadOpenOptions {
  instanceId: string;
  surface: LeadSurface;
}
