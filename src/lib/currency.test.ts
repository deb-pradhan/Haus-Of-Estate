import { afterEach, describe, expect, it, vi } from "vitest";
import { convertPrice, isCurrencyChoice, isRateDateCurrent, parseExchangeRates, parseLegacyPrice, propertyPriceInput, resolvePriceQuote, sourcePriceText, type ExchangeRates } from "./currency";

const rates: ExchangeRates = { base: "USD", rates: { USD: 1, AED: 3.6725, GBP: 0.74 }, asOf: "2026-09-14", fetchedAt: "2026-09-14T10:00:00Z", source: "Frankfurter" };
afterEach(() => vi.useRealTimers());

describe("indicative currency display", () => {
  it("converts the original amount directly across all supported currencies", () => {
    vi.setSystemTime(new Date("2026-09-14T11:00:00Z"));
    expect(convertPrice(3672.5, "AED", "USD", rates)).toBeCloseTo(1000);
    expect(convertPrice(3672.5, "AED", "GBP", rates)).toBeCloseTo(740);
    expect(convertPrice(740, "GBP", "AED", rates)).toBeCloseTo(3672.5);
    expect(convertPrice(1000, "USD", "GBP", rates)).toBeCloseTo(740);
    expect(rates.rates.AED).toBe(3.6725);
  });

  it("does not invent conversions for missing rates, unsupported currencies or invalid amounts", () => {
    expect(convertPrice(100, "AED", "GBP", null)).toBeNull();
    expect(convertPrice(100, "EUR", "GBP", rates)).toBeNull();
    expect(convertPrice("AED 100", "AED", "GBP", rates)).toBeNull();
    expect(convertPrice(-10, "AED", "AED", rates)).toBeNull();
    expect(convertPrice(Infinity, "AED", "AED", rates)).toBeNull();
    expect(convertPrice(100, "AED", "AED", null)).toBe(100);
    expect(sourcePriceText(1000, "EUR")).toBe("EUR 1,000");
  });

  it("keeps a structured range's amount as a reference price without parsing a maximum", () => {
    const input = { amount: 3350000, currency: "AED", displayText: "AED 3,350,000–5,115,000 · Clusters 1 & 2" };
    expect(resolvePriceQuote(input)).toEqual({ amount: 3350000, currency: "AED", period: undefined, from: false });
    expect(input.displayText).toContain("5,115,000");
    expect(parseLegacyPrice(input.displayText)).toBeNull();
  });

  it("recognizes only exact unambiguous legacy prices, preserving From and rent period", () => {
    expect(parseLegacyPrice("From AED 50,039,000")).toEqual({ amount: 50039000, currency: "AED", from: true, period: undefined });
    expect(parseLegacyPrice("From £2,500 / month")).toEqual({ amount: 2500, currency: "GBP", from: true, period: "month" });
    expect(parseLegacyPrice("US$ 2,000.50 / year")?.amount).toBe(2000.5);
    for (const text of ["$1,000", "AED 1,000–2,000", "AED 1m", "Approx AED 1,000", "AED 1,000 + fees", "AED 1,00", "AED 0", "AED 100 / month available now", "Price on application", "AED 100 GBP 20"]) expect(parseLegacyPrice(text), text).toBeNull();
    expect(resolvePriceQuote({ amount: 500, currency: "USD", displayText: "From AED 50,039,000" })?.amount).toBe(500);
    expect(resolvePriceQuote({ currency: "EUR", displayText: "AED 100" })).toBeNull();
    expect(resolvePriceQuote({ amount: 500000, currency: "AED", displayText: "Price on application" })).toBeNull();
    expect(resolvePriceQuote({ amount: 500000, currency: "AED", displayText: "POA" })).toBeNull();
  });

  it("selects rent fields and period instead of showing a sale price for a rent listing", () => {
    const property = { priceAmount: 300000, priceCurrency: "GBP", priceDisplay: "£300,000", rentAmount: 1200, rentCurrency: "GBP", rentPeriod: "month", listingType: ["sale", "rent"] };
    expect(propertyPriceInput(property, true)).toEqual({ amount: 1200, currency: "GBP", displayText: undefined, period: "month" });
    expect(propertyPriceInput({ ...property, listingType: ["rent"], rentAmount: undefined }).amount).toBeUndefined();
    expect(sourcePriceText(1200, "GBP", "month")).toBe("£1,200 / month");
  });

  it("rejects stale, impossible, future or malformed feed data while permitting weekend dates", () => {
    const now = Date.parse("2026-09-14T11:00:00Z");
    expect(parseExchangeRates(rates, now)).toEqual(rates);
    expect(isRateDateCurrent("2026-09-11", now)).toBe(true);
    expect(isRateDateCurrent("2026-09-07", now)).toBe(false);
    expect(isRateDateCurrent("2026-09-15", now)).toBe(false);
    expect(isRateDateCurrent("2026-02-30", now)).toBe(false);
    expect(parseExchangeRates({ ...rates, rates: { USD: 1, AED: 0, GBP: 0.74 } }, now)).toBeNull();
    expect(isCurrencyChoice("original")).toBe(true);
    expect(isCurrencyChoice("EUR")).toBe(false);
  });
});
