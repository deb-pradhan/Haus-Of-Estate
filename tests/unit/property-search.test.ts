import { describe, expect, it } from "vitest";
import {
  matchesPropertySearch,
  normalizePropertySearchParams,
  searchAmount,
} from "../../src/lib/property-search";
import { buildPropertiesHref } from "../../src/lib/property-taxonomy";
import { marketLinks } from "../../src/lib/property-markets";

const property = {
  title: "Garden Villa",
  slug: "garden-villa",
  developer: "Azizi",
  country: "United Arab Emirates",
  city: "Dubai",
  priceAmount: 500000,
  priceCurrency: "AED",
};

describe("property search", () => {
  it("matches all keywords across public listing fields, without case sensitivity", () => {
    expect(matchesPropertySearch(property, { q: "DUBAI azizi" })).toBe(true);
    expect(matchesPropertySearch(property, { q: "Dubai Greece" })).toBe(false);
    expect(matchesPropertySearch({ ...property, summary: 'Views of landscaped gardens', unitType: 'Townhouse' }, { q: 'townhouse landscaped' })).toBe(true);
  });
  it("compares inclusive native-currency budgets and excludes POA and mixed currencies", () => {
    expect(
      matchesPropertySearch(property, {
        minPrice: "500000",
        maxPrice: "500000",
        currency: "AED",
      }),
    ).toBe(true);
    expect(
      matchesPropertySearch(property, { maxPrice: "500000", currency: "GBP" }),
    ).toBe(false);
    expect(
      matchesPropertySearch(
        { ...property, priceDisplay: "POA" },
        { maxPrice: "500000", currency: "AED" },
      ),
    ).toBe(false);
    expect(
      matchesPropertySearch({ ...property, priceDisplay: "POA" }, {}),
    ).toBe(true);
  });
  it("normalises rent to a month and does not use a sale price as rent", () => {
    const rent = {
      ...property,
      rentAmount: 120000,
      rentCurrency: "AED",
      rentPeriod: "year",
    };
    expect(
      matchesPropertySearch(rent, {
        intent: "rent",
        maxPrice: "10000",
        currency: "AED",
      }),
    ).toBe(true);
    expect(
      matchesPropertySearch(rent, {
        intent: "rent",
        maxPrice: "9999",
        currency: "AED",
      }),
    ).toBe(false);
    expect(
      matchesPropertySearch(
        { ...rent, rentPeriod: "week", rentAmount: 1200 },
        { intent: "rent", maxPrice: "5200", currency: "AED" },
      ),
    ).toBe(true);
    expect(
      matchesPropertySearch(property, {
        intent: "rent",
        maxPrice: "500000",
        currency: "AED",
      }),
    ).toBe(false);
  });
  it("rejects malformed budget amounts and handles zero as a real budget", () => {
    for (const value of [
      "-1",
      "NaN",
      "Infinity",
      "1e6",
      "1,000",
      "9".repeat(25),
    ])
      expect(searchAmount(value)).toBeNull();
    expect(searchAmount("0")).toBe(0);
    expect(
      matchesPropertySearch(property, { maxPrice: "0", currency: "AED" }),
    ).toBe(false);
  });
  it("does not compare rental amounts with an unscoped or sale budget", () => {
    const rentOnly = { title: "Rental", slug: "rental", rentAmount: 12000, rentCurrency: "GBP", rentPeriod: "year" };
    expect(matchesPropertySearch(rentOnly, { maxPrice: "15000", currency: "GBP" })).toBe(false);
    expect(matchesPropertySearch(rentOnly, { intent: "sale", maxPrice: "15000", currency: "GBP" })).toBe(false);
    expect(matchesPropertySearch(rentOnly, { intent: "rent", maxPrice: "1000", currency: "GBP" })).toBe(true);
  });
  it("preserves search parameters in URLs and forces off-plan to sales", () => {
    const url = new URL(
      buildPropertiesHref({
        q: "Azizi & Dubai",
        country: "United Kingdom",
        city: "London",
        area: "King's Cross & St Pancras",
        availability: "off-plan",
        intent: "rent",
        minPrice: 0,
        maxPrice: 800000,
        currency: "AED",
      }),
      "https://hausofestate.com",
    );
    expect(url.searchParams.get("q")).toBe("Azizi & Dubai");
    expect(url.searchParams.get("intent")).toBe("sale");
    expect(url.searchParams.get("minPrice")).toBe("0");
    expect(url.searchParams.get("currency")).toBe("AED");
    expect(url.searchParams.get("area")).toBe("King's Cross & St Pancras");
    expect(url.searchParams.get("city")).toBe("London");
  });
  it("normalizes repeated Next.js parameters before trimming, matching and budgeting", () => {
    const filters = normalizePropertySearchParams({
      category: ['residential', 'commercial'], country: [' United Arab Emirates ', 'United Kingdom'],
      city: [' Dubai ', 'London'], area: [' Downtown ', 'Elsewhere'],
      q: [' Azizi ', 'Missing'], minPrice: [' 500000 ', '600000'],
      maxPrice: ['500000', '0'], currency: ['AED', 'GBP'], beds: [],
    });
    expect(filters).toEqual({ category: 'residential', country: 'United Arab Emirates', city: 'Dubai',
      area: 'Downtown', q: 'Azizi', minPrice: '500000', maxPrice: '500000', currency: 'AED' });
    expect(matchesPropertySearch(property, filters)).toBe(true);
    expect(normalizePropertySearchParams({ q: ['', 'second'] }).q).toBe('');
  });
  it("country navigation carries the selected market and mode into real search URLs", () => {
    const links = marketLinks("Greece");
    const commercialRent = new URL(
      links.find((link) => link.label === "Commercial rentals")!.href,
      "https://hausofestate.com",
    );
    expect(commercialRent.searchParams.get("country")).toBe("Greece");
    expect(commercialRent.searchParams.get("category")).toBe("commercial");
    expect(commercialRent.searchParams.get("intent")).toBe("rent");
  });
});
