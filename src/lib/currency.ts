export const DISPLAY_CURRENCIES = ["AED", "GBP", "USD"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];
export type CurrencyChoice = DisplayCurrency | "original";

export interface ExchangeRates {
  base: "USD";
  rates: Record<DisplayCurrency, number>;
  asOf: string;
  fetchedAt: string;
  source: "Frankfurter";
}

export interface PropertyPricing {
  priceAmount?: number;
  priceCurrency?: string;
  priceDisplay?: string;
  rentAmount?: number;
  rentCurrency?: string;
  rentPriceDisplay?: string;
  rentPeriod?: string;
  listingType?: string[] | null;
}

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  return typeof value === "string" && DISPLAY_CURRENCIES.includes(value as DisplayCurrency);
}

export function isCurrencyChoice(value: unknown): value is CurrencyChoice {
  return value === "original" || isDisplayCurrency(value);
}

export function isPriceAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

// Allow weekends and bank holidays, but never present an indefinitely stale rate.
export function isRateDateCurrent(value: unknown, now = Date.now()): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === value &&
    date <= now && now - date < 7 * 86_400_000;
}

export function parseExchangeRates(value: unknown, now = Date.now()): ExchangeRates | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<ExchangeRates>;
  if (data.base !== "USD" || data.source !== "Frankfurter" || !isRateDateCurrent(data.asOf, now) ||
    typeof data.fetchedAt !== "string" || !Number.isFinite(Date.parse(data.fetchedAt)) || !data.rates ||
    data.rates.USD !== 1 || !DISPLAY_CURRENCIES.every(currency => isPriceAmount(data.rates?.[currency]))) return null;
  return data as ExchangeRates;
}

export function convertPrice(amount: unknown, from: unknown, to: DisplayCurrency, rates: ExchangeRates | null): number | null {
  if (!isPriceAmount(amount) || !isDisplayCurrency(from)) return null;
  if (from === to) return amount;
  if (!rates || !parseExchangeRates(rates)) return null;
  const converted = amount / rates.rates[from] * rates.rates[to];
  return isPriceAmount(converted) ? converted : null;
}

export function formatPriceNumber(amount: number): string {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(amount);
}

export function sourcePriceText(amount?: number, currency?: string, period?: string): string {
  if (!isPriceAmount(amount) || !currency || !/^[A-Z]{3}$/.test(currency)) return "Price on application";
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "US$" : `${currency} `;
  const suffix = ["week", "month", "year"].includes(period ?? "") ? ` / ${period}` : "";
  return `${symbol}${formatPriceNumber(amount)}${suffix}`;
}

export interface PriceInput {
  amount?: number;
  currency?: string;
  displayText?: string;
  period?: string;
}

// Legacy CMS records sometimes contain an exact price but no numeric fields.
// Only an entire, unambiguous single-price string is eligible. Ranges, prose,
// bare "$", approximate values and mixed currencies remain original copy.
export function parseLegacyPrice(text: unknown) {
  if (typeof text !== "string") return null;
  const match = /^(From\s+)?(AED|GBP|USD|£|US\$)\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?:\s*\/\s*(week|month|year))?$/i.exec(text.trim());
  if (!match) return null;
  const amount = Number(match[3].replaceAll(",", ""));
  if (!isPriceAmount(amount) || amount > Number.MAX_SAFE_INTEGER) return null;
  const code = match[2].toUpperCase();
  const currency: DisplayCurrency = code === "£" ? "GBP" : code === "US$" ? "USD" : code as DisplayCurrency;
  return { amount, currency, period: match[4]?.toLowerCase(), from: Boolean(match[1]) };
}

export function resolvePriceQuote(input: PriceInput) {
  if (/^(?:price on application|p\.?o\.?a\.?)$/i.test(input.displayText?.trim() ?? "")) return null;
  const legacy = parseLegacyPrice(input.displayText);
  // A partially populated structured quote must not be silently contradicted.
  if (input.amount != null || input.currency != null) {
    if (!isPriceAmount(input.amount) || !isDisplayCurrency(input.currency)) return null;
    return {
      amount: input.amount,
      currency: input.currency,
      period: input.period,
      from: Boolean(legacy?.from && legacy.amount === input.amount && legacy.currency === input.currency),
    };
  }
  return legacy;
}

export function propertyPriceInput(property: PropertyPricing, rent = false) {
  const rentOnly = property.listingType?.includes("rent") && !property.listingType.includes("sale");
  if (rent || rentOnly) return {
    amount: property.rentAmount, currency: property.rentCurrency,
    displayText: property.rentPriceDisplay, period: property.rentPeriod,
  };
  return { amount: property.priceAmount, currency: property.priceCurrency, displayText: property.priceDisplay };
}
