import { describe, expect, it } from "vitest";
import {
  isPurchaseReadinessVisible,
  resolvePurchaseReadiness,
} from "./purchase-readiness";

describe("resolvePurchaseReadiness", () => {
  it("uses project-specific escrow wording for Dubai off-plan property", () => {
    const guidance = resolvePurchaseReadiness({
      city: "Dubai",
      country: "United Arab Emirates",
      availability: ["off-plan"],
    });

    expect(guidance.market).toBe("dubai_off_plan");
    expect(guidance.steps).toHaveLength(5);
    expect(guidance.steps[3].description).toContain(
      "project-specific escrow arrangement",
    );
    expect(guidance.steps[3].description).toContain(
      "Haus does not receive or forward the money",
    );
  });

  it.each([
    ["London", "United Kingdom", "uk"],
    ["Bali", "Indonesia", "bali"],
    ["Paphos", "Cyprus", "cyprus"],
    ["Abu Dhabi", "United Arab Emirates", "uae"],
    ["Lisbon", "Portugal", "international"],
  ])("resolves %s, %s as %s", (city, country, market) => {
    expect(resolvePurchaseReadiness({ city, country }).market).toBe(market);
  });
});

describe("isPurchaseReadinessVisible", () => {
  it("stays absent while the feature flag is disabled", () => {
    expect(isPurchaseReadinessVisible(false, ["sale"])).toBe(false);
  });

  it("appears for sale-capable and historical unclassified property pages", () => {
    expect(isPurchaseReadinessVisible(true, ["sale"])).toBe(true);
    expect(isPurchaseReadinessVisible(true, ["sale", "rent"])).toBe(true);
    expect(isPurchaseReadinessVisible(true, ["rent"])).toBe(false);
    expect(isPurchaseReadinessVisible(true)).toBe(true);
    expect(isPurchaseReadinessVisible(true, null)).toBe(true);
  });

  it("handles legacy null availability values", () => {
    expect(
      resolvePurchaseReadiness({
        city: "Dubai",
        country: "United Arab Emirates",
        availability: null,
      }).market,
    ).toBe("dubai_ready");
  });
});
