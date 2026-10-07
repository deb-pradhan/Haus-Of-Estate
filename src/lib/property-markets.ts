import {
  buildPropertiesHref,
  type Category,
  type Intent,
} from "./property-taxonomy";

// Confirmed operating markets. Listing availability still comes from Sanity;
// appearing here does not imply that a property is currently available.
export const PROPERTY_MARKETS = [
  { country: "United Kingdom", detail: "Across the UK" },
  { country: "United Arab Emirates", detail: "Dubai and beyond" },
  { country: "Greece", detail: "Including Elounda Hills" },
] as const;

export const PROPERTY_SEARCH_MODES = [
  { id: "sales", label: "Sales", category: "residential", intent: "sale" },
  { id: "rentals", label: "Rentals", category: "residential", intent: "rent" },
  {
    id: "commercial-sales",
    label: "Commercial sales",
    category: "commercial",
    intent: "sale",
  },
  {
    id: "commercial-rentals",
    label: "Commercial rentals",
    category: "commercial",
    intent: "rent",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  category: Category;
  intent: Intent;
}[];

export function marketLinks(country: string) {
  return PROPERTY_SEARCH_MODES.map((mode) => ({
    label: mode.label,
    href: buildPropertiesHref({
      country,
      category: mode.category,
      intent: mode.intent,
    }),
  }));
}
