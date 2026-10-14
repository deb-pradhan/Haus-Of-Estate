import {
  isDisplayCurrency,
  propertyPriceInput,
  resolvePriceQuote,
  type PropertyPricing,
} from "./currency";

export function searchAmount(value?: string): number | null {
  if (!value?.trim() || !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) &&
    number >= 0 &&
    number <= Number.MAX_SAFE_INTEGER
    ? number
    : null;
}

export function matchesPropertySearch(
  property: PropertyPricing & {
    title: string;
    slug: string;
    developer?: string;
    community?: string;
    country?: string;
    city?: string;
    masterDevelopment?: string;
  },
  filters: {
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    currency?: string;
    intent?: string;
  },
) {
  const words = (filters.q ?? "")
    .trim()
    .slice(0, 120)
    .toLocaleLowerCase("en-GB")
    .split(/\s+/)
    .filter(Boolean);
  const text = [
    property.title,
    property.slug,
    property.developer,
    property.community,
    property.country,
    property.city,
    property.masterDevelopment,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en-GB");
  if (!words.every((word) => text.includes(word))) return false;
  const min = searchAmount(filters.minPrice);
  const max = searchAmount(filters.maxPrice);
  if (min === null && max === null) return true;
  // Budgets compare source currency, never mixed currencies or an invented FX rate.
  if (!isDisplayCurrency(filters.currency)) return false;
  const quote = resolvePriceQuote(
    propertyPriceInput(property, filters.intent === "rent"),
  );
  if (!quote || quote.currency !== filters.currency) return false;
  if (filters.intent !== "rent" && quote.period) return false;
  let amount = quote.amount;
  if (filters.intent === "rent") {
    if (quote.period === "year") amount /= 12;
    else if (quote.period === "week") amount *= 52 / 12;
    else if (quote.period !== "month") return false;
  }
  return (min === null || amount >= min) && (max === null || amount <= max);
}
