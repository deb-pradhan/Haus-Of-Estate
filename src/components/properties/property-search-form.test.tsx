// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PropertySearchForm } from "./property-search-form";
import type { PropertyQuery } from "@/lib/property-taxonomy";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/lib/analytics", () => ({ trackAnalytics: analytics.track }));

const locations = [
  {
    country: "United Kingdom",
    cities: ["London", "Manchester"],
    areasByCity: { London: ["Canary Wharf", "Shoreditch"], Manchester: ["Ancoats"] },
  },
  {
    country: "United Arab Emirates",
    cities: ["Dubai", "Sharjah"],
    areasByCity: { Dubai: ["Downtown"], Sharjah: ["Florence"] },
  },
];
const fetcher = vi.fn<typeof fetch>();
let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", fetcher);
  fetcher.mockImplementation(async () => Response.json({ locations }));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  fetcher.mockReset();
});

async function render(initial?: PropertyQuery) {
  await act(async () => root.render(<PropertySearchForm initial={initial} />));
}

function select(label: string) {
  return host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
}

async function choose(label: string, value: string) {
  await act(async () => {
    const field = select(label);
    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function input(selector: string, value: string) {
  await act(async () => {
    const field = host.querySelector<HTMLInputElement>(selector)!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function click(text: string) {
  await act(async () => {
    [...host.querySelectorAll("button")].find((button) => button.textContent === text)!.click();
  });
}

async function submit() {
  await act(async () => {
    host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

function submittedParams() {
  return new URL(navigation.push.mock.lastCall![0], "https://example.test").searchParams;
}

describe("property search interactions", () => {
  it("scopes cities and areas to their parents and clears dependent selections", async () => {
    await render();
    expect(select("City of interest").disabled).toBe(true);
    expect(select("Area of interest").disabled).toBe(true);
    await choose("Country of interest", "United Kingdom");
    expect(select("City of interest").disabled).toBe(false);
    expect(select("Area of interest").disabled).toBe(true);
    expect(select("City of interest").textContent).not.toContain("Dubai");
    await choose("City of interest", "London");
    await choose("Area of interest", "Shoreditch");
    await choose("City of interest", "Manchester");
    expect(select("Area of interest").value).toBe("");
    expect(select("Area of interest").textContent).toContain("Ancoats");
    expect(select("Area of interest").textContent).not.toContain("Shoreditch");
    await choose("Area of interest", "Ancoats");
    await choose("Country of interest", "United Arab Emirates");
    expect(select("City of interest").value).toBe("");
    expect(select("Area of interest").value).toBe("");
    expect(select("Area of interest").disabled).toBe(true);
    expect(select("City of interest").textContent).not.toContain("London");
  });

  it("keeps the full selection in the result URL without sending location or keywords to analytics", async () => {
    await render();
    await choose("Country of interest", "United Kingdom");
    await choose("City of interest", "London");
    await choose("Area of interest", "Canary Wharf");
    await choose("Property type", "Apartment");
    await choose("Bedrooms", "3");
    await input('input[type="search"]', "Canary & riverside");
    await submit();
    expect(Object.fromEntries(submittedParams())).toEqual({
      category: "residential", intent: "sale", country: "United Kingdom",
      city: "London", area: "Canary Wharf", type: "Apartment", beds: "3", q: "Canary & riverside",
    });
    expect(analytics.track).toHaveBeenCalledExactlyOnceWith("haus_property_search", {
      category: "residential", intent: "sale",
    });
  });

  it("explains an unavailable locations service and allows retry without losing the selected country", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ error: "Unavailable" }, { status: 503 }));
    await render({ country: "United Kingdom" });
    expect(host.querySelector('[role="status"]')?.textContent).toContain("couldn’t load");
    expect(select("Country of interest").value).toBe("United Kingdom");
    await click("Retry locations");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(host.textContent).not.toContain("couldn’t load");
    expect(select("Country of interest").value).toBe("United Kingdom");
    expect(select("City of interest").disabled).toBe(false);
    await choose("City of interest", "London");
    expect(select("Area of interest").textContent).toContain("Canary Wharf");
  });

  it("keeps a bookmarked city and area usable when options cannot load", async () => {
    fetcher.mockRejectedValueOnce(new Error("offline"));
    await render({ country: "United Kingdom", city: "London", area: "Shoreditch" });
    expect(select("City of interest").disabled).toBe(false);
    expect(select("City of interest").value).toBe("London");
    expect(select("Area of interest").disabled).toBe(false);
    expect(select("Area of interest").value).toBe("Shoreditch");
    await submit();
    expect(submittedParams().get("area")).toBe("Shoreditch");
    await choose("Area of interest", "");
    await submit();
    expect(submittedParams().has("area")).toBe(false);
  });

  it("shows canonical options for bookmarked locations with different case and spacing", async () => {
    await render({ country: "united   kingdom", city: "london", area: "canary  wharf" });
    expect(select("Country of interest").value).toBe("United Kingdom");
    expect(select("City of interest").value).toBe("London");
    expect(select("Area of interest").value).toBe("Canary Wharf");
    expect([...select("Country of interest").options].filter((option) => /united\s+kingdom/i.test(option.text))).toHaveLength(1);
    expect([...select("Area of interest").options].filter((option) => /canary\s+wharf/i.test(option.text))).toHaveLength(1);
    await submit();
    expect(submittedParams().has("area")).toBe(true);
  });

  it("preserves an unscoped result search and its separate legacy location filter", async () => {
    await render({ category: "", intent: "", q: "London", location: "North London" });
    await submit();
    expect(Object.fromEntries(submittedParams())).toEqual({ q: "London", location: "North London" });
    expect([...host.querySelectorAll('button[aria-pressed="true"]')]).toHaveLength(0);
  });

  it("drops residential bedrooms, property type and sale budget when changing to commercial rentals", async () => {
    await render({ type: "Villa", beds: "4", minPrice: "1000000", maxPrice: "2000000", currency: "AED", availability: "off-plan" });
    await click("Commercial rentals");
    expect(host.querySelector('select[aria-label="Bedrooms"]')).toBeNull();
    expect(select("Property type").value).toBe("");
    expect(host.querySelector<HTMLInputElement>('input[placeholder="No minimum"]')!.value).toBe("");
    expect(host.querySelector<HTMLInputElement>('input[placeholder="No maximum"]')!.value).toBe("");
    await submit();
    expect(Object.fromEntries(submittedParams())).toEqual({ category: "commercial", availability: "ready", intent: "rent" });
  });

  it("keeps visitors on the form with a useful message for an inverted budget", async () => {
    await render();
    await input('input[placeholder="No minimum"]', "500000");
    await input('input[placeholder="No maximum"]', "100000");
    await submit();
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Maximum price must be at least the minimum price.");
    expect(navigation.push).not.toHaveBeenCalled();
    expect(analytics.track).not.toHaveBeenCalled();
  });
});
