// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadEoiForm } from "./lead-eoi-form";

const calls = vi.hoisted(() => ({ submit: vi.fn(), track: vi.fn(), prime: vi.fn(), attribution: vi.fn() }));
vi.mock("@/lib/lead-intake/client", async (original) => ({
  ...await original<typeof import("@/lib/lead-intake/client")>(),
  submitLeadEnquiry: calls.submit,
}));
vi.mock("./use-lead-readiness", () => ({
  useLeadReadiness: () => ({ intakeReady: false, brochureEmailEnabled: false }),
}));
vi.mock("./analytics", () => ({ trackLeadEvent: calls.track }));
vi.mock("./attribution", () => ({ primeLeadAttribution: calls.prime, getLeadAttribution: calls.attribution }));

const launch = {
  key: "palm-springs-by-nakheel",
  title: "Palm Springs by Nakheel",
  developer: "Nakheel",
  community: "Jebel Ali",
  city: "Dubai",
  country: "United Arab Emirates",
  unitTypes: ["Townhouse", "Villa"],
  bedrooms: ["3", "4", "5"],
  qualification: "Pre-launch. Registering interest involves no payment and does not reserve a home.",
};

let root: Root;
let host: HTMLDivElement;
const localSubmit = vi.fn(async () => {});

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn());
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function input(suffix: string, value: string) {
  const field = host.querySelector<HTMLInputElement>(`input[id$="${suffix}"]`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function next() {
  await act(async () => {
    host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await act(async () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())));
}

function optionsOf(idSuffix: string): string[] | null {
  const select = host.querySelector<HTMLSelectElement>(`select[id$="${idSuffix}"]`);
  return select ? Array.from(select.options).map((option) => option.value).filter(Boolean) : null;
}

describe("lead form with a launch interest", () => {
  it("shows the launch panel, hides sale and newsletter choices, and offers only the reported home types and bedrooms", async () => {
    await act(async () => root.render(
      <LeadEoiForm surface="launch_article" launchInterest={launch} localDemo={{ onSubmit: localSubmit }} />,
    ));
    expect(host.textContent).toContain("Launch interest");
    expect(host.textContent).toContain("Palm Springs by Nakheel");
    expect(host.textContent).toContain(launch.qualification);
    await input("-first-name", "Alex");
    await input("-email", "alex@example.test");
    await act(async () => host.querySelector<HTMLInputElement>('input[id$="-privacy-acknowledged"]')!.click());
    await next();

    const interests = Array.from(host.querySelectorAll<HTMLInputElement>('input[type="radio"]')).map((radio) => radio.value);
    expect(interests).toEqual(expect.arrayContaining(["buy", "invest"]));
    expect(interests).not.toContain("sell_let");
    expect(interests).not.toContain("newsletter_only");
    expect(host.querySelector<HTMLInputElement>('input[type="radio"][value="buy"]')!.checked).toBe(true);
    await next();

    expect(host.textContent).toContain("Home type (reported options)");
    expect(host.textContent).toContain("Bedrooms (reported options)");
    expect(host.textContent).toContain("reported pre-launch options, not confirmed availability");
    expect(optionsOf("-property-type")).toEqual(["Townhouse", "Villa"]);
    expect(optionsOf("-bedrooms")).toEqual(["3", "4", "5"]);
    expect(optionsOf("-bathrooms")).toBeNull();
    expect(host.textContent).not.toContain("Studio");

    const bedrooms = host.querySelector<HTMLSelectElement>('select[id$="-bedrooms"]')!;
    await act(async () => {
      bedrooms.value = "4";
      bedrooms.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await next();

    expect(localSubmit).toHaveBeenCalledWith(expect.objectContaining({
      interest: "buy",
      launchInterest: { key: "palm-springs-by-nakheel" },
      project: undefined,
      brochure: undefined,
      preferences: expect.objectContaining({ market: "United Arab Emirates", location: "Jebel Ali", bedrooms: "4" }),
      newsletterOptIn: false,
      propertyMatchOptIn: false,
    }));
    expect(calls.submit).not.toHaveBeenCalled();
  });

  it("keeps the generic lists for a published property", async () => {
    await act(async () => root.render(
      <LeadEoiForm surface="manual_cta" initialInterest="buy" project={{ slug: "azizi-florence-4-bedroom-villas", title: "Florence villas" }} localDemo={{ onSubmit: localSubmit }} />,
    ));
    await input("-first-name", "Alex");
    await input("-email", "alex@example.test");
    await act(async () => host.querySelector<HTMLInputElement>('input[id$="-privacy-acknowledged"]')!.click());
    await next();
    await next();
    expect(host.textContent).toContain("Property type");
    expect(host.textContent).not.toContain("reported options");
    expect(optionsOf("-bedrooms")).toContain("Studio");
    expect(optionsOf("-bathrooms")).not.toBeNull();
  });
});
