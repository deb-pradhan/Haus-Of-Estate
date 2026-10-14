import { afterEach, describe, expect, it, vi } from "vitest";
import { EXCHANGE_RATES_URL, fetchExchangeRates } from "./exchange-rates";
import { GET } from "@/app/api/exchange-rates/route";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("exchange-rate service", () => {
  it("fetches a fixed public pair list with hourly caching and keeps the oldest rate date", async () => {
    vi.setSystemTime(new Date("2026-09-14T10:00:00Z"));
    const fetcher = vi.fn().mockResolvedValue(Response.json([
      { base: "USD", quote: "AED", date: "2026-09-14", rate: 3.6725 },
      { base: "USD", quote: "GBP", date: "2026-09-11", rate: 0.74 },
    ]));
    vi.stubGlobal("fetch", fetcher);
    expect(await fetchExchangeRates()).toEqual({ base: "USD", rates: { USD: 1, AED: 3.6725, GBP: 0.74 }, asOf: "2026-09-11", fetchedAt: "2026-09-14T10:00:00.000Z", source: "Frankfurter" });
    expect(fetcher).toHaveBeenCalledWith(EXCHANGE_RATES_URL, expect.objectContaining({ next: { revalidate: 3600 }, headers: { Accept: "application/json" } }));
  });

  it.each([
    [{ base: "USD", quote: "AED", date: "2026-09-14", rate: 3.6725 }],
    [{ base: "USD", quote: "AED", date: "2026-09-14", rate: 3.6725 }, { base: "USD", quote: "AED", date: "2026-09-14", rate: 3.6725 }],
    [{ base: "EUR", quote: "AED", date: "2026-09-14", rate: 3.6725 }, { base: "USD", quote: "GBP", date: "2026-09-14", rate: 0.74 }],
    [{ base: "USD", quote: "AED", date: "2026-08-14", rate: 3.6725 }, { base: "USD", quote: "GBP", date: "2026-09-14", rate: 0.74 }],
  ])("returns an uncached 503 for unusable rates (%#)", async (...rows) => {
    vi.setSystemTime(new Date("2026-09-14T10:00:00Z"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(rows)));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).not.toHaveProperty("rates");
  });

  it("falls back honestly during a provider outage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const response = await GET();
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("Original prices");
  });
});
