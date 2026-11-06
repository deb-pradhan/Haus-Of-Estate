// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadEoiForm } from "./lead-eoi-form";

const calls = vi.hoisted(() => ({
  submit: vi.fn(),
  readiness: vi.fn(),
  track: vi.fn(),
  prime: vi.fn(),
  attribution: vi.fn(),
}));
vi.mock("@/lib/lead-intake/client", async (original) => ({
  ...await original<typeof import("@/lib/lead-intake/client")>(),
  submitLeadEnquiry: calls.submit,
}));
vi.mock("./use-lead-readiness", () => ({
  useLeadReadiness: (check: boolean) => {
    calls.readiness(check);
    return { intakeReady: false, brochureEmailEnabled: false };
  },
}));
vi.mock("./analytics", () => ({ trackLeadEvent: calls.track }));
vi.mock("./attribution", () => ({
  primeLeadAttribution: calls.prime,
  getLeadAttribution: calls.attribution,
}));

let root: Root;
let host: HTMLDivElement;
const localSubmit = vi.fn(async () => {});
const reset = vi.fn();
const scrollIntoView = vi.fn();
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
const project = {
  slug: "azizi-florence-4-bedroom-villas",
  title: "Azizi Florence — 4-Bedroom Villas",
};

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn());
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
  calls.attribution.mockReturnValue({ surface: "manual_cta", pagePath: "/properties" });
  calls.submit.mockResolvedValue({
    success: true, status: "created", leadId: "real-receipt", submissionId: "receipt",
  });
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
  if (originalScrollIntoView) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

async function renderForm(withBrochure = true) {
  await act(async () => root.render(
    <LeadEoiForm
      surface="manual_cta"
      initialInterest="buy"
      project={project}
      brochureRequest={withBrochure ? { design: { id: "villa-4-a", label: "Type A" } } : undefined}
      localDemo={{
        onSubmit: localSubmit,
        onReset: reset,
        confirmation: <div>Selected brochure email preview</div>,
      }}
    />,
  ));
}

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

async function enterDetails() {
  await input("-first-name", "Alex");
  await input("-email", "alex@example.test");
}

async function acknowledgePrivacy() {
  await act(async () => host.querySelector<HTMLInputElement>('input[id$="-privacy-acknowledged"]')!.click());
}

describe("local brochure form walkthrough", () => {
  it("keeps privacy required, passes the selected design and leaves marketing optional without saving or tracking", async () => {
    await renderForm();
    expect(host.querySelectorAll('ol[aria-label="Enquiry progress"] li')).toHaveLength(2);
    expect(host.querySelector("details")?.open).toBe(false);
    expect(host.textContent).toContain("Next: review");
    await enterDetails();
    await next();
    expect(host.textContent).toContain("Confirm that you have read and understood the privacy notice.");
    expect(localSubmit).not.toHaveBeenCalled();
    await acknowledgePrivacy();
    await next();
    expect(host.textContent).toContain("Review your request");
    expect(host.textContent).toContain("alex@example.test");
    expect(host.textContent).toContain("Design of interest: Type A");
    expect(host.textContent).toContain("Leave both boxes unticked");
    expect(host.textContent).toContain("Requesting the brochure does not subscribe you to marketing emails.");
    const emailUpdates = host.querySelector("details")!;
    expect(emailUpdates.open).toBe(false);
    expect(emailUpdates.querySelector("summary")?.textContent).toBe("Optional email updates");
    await act(async () => emailUpdates.querySelector("summary")!.click());
    expect(emailUpdates.open).toBe(true);
    const newsletter = host.querySelector<HTMLInputElement>('input[id$="-newsletter-opt-in"]')!;
    await act(async () => newsletter.click());
    expect(newsletter.checked).toBe(true);
    expect(host.querySelector<HTMLInputElement>('input[id$="-property-match-opt-in"]')!.checked).toBe(false);
    await act(async () => newsletter.click());
    await act(async () => emailUpdates.querySelector("summary")!.click());
    expect(emailUpdates.open).toBe(false);
    expect(host.querySelectorAll('input[type="radio"], select')).toHaveLength(0);
    expect(host.querySelector('input[id$="-overseas-cash-buyer"]')).toBeNull();
    await next();

    expect(localSubmit).toHaveBeenCalledOnce();
    expect(localSubmit).toHaveBeenCalledWith(expect.objectContaining({
      project: { slug: project.slug },
      interest: "buy",
      brochure: { designId: "villa-4-a" },
      contact: expect.objectContaining({ firstName: "Alex", email: "alex@example.test" }),
      privacyAcknowledged: true,
      propertyMatchOptIn: false,
      newsletterOptIn: false,
    }));
    expect(host.textContent).toContain("Demo complete — nothing saved or sent");
    expect(host.textContent).toContain("Alex, this is your preview for Azizi Florence — 4-Bedroom Villas — Type A");
    expect(host.textContent).toContain("Selected brochure email preview");
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "start" });
    expect(host.textContent).not.toContain("Brochure request saved");
    expect(calls.readiness.mock.calls.every(([check]) => check === false)).toBe(true);
    expect(calls.submit).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(calls.track).not.toHaveBeenCalled();
    expect(calls.prime).not.toHaveBeenCalled();
    expect(calls.attribution).not.toHaveBeenCalled();
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(reset).toHaveBeenCalledOnce();
    expect(host.querySelector("form")).not.toBeNull();
  });

  it("ignores the demo adapter outside development and retains normal intake", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await renderForm();
    expect(host.textContent).not.toContain("Local demonstration");
    expect(host.textContent).toContain("Brochure email is currently unavailable");
    await enterDetails();
    await acknowledgePrivacy();
    await next();
    await next();
    expect(localSubmit).not.toHaveBeenCalled();
    expect(calls.submit).toHaveBeenCalledOnce();
    const submitted = calls.submit.mock.calls[0][0];
    expect(submitted.brochure).toBeUndefined();
    expect(submitted.contact.message).toContain("Requested design: Type A (villa-4-a)");
    expect(submitted.project).toEqual({ slug: project.slug });
    expect(submitted.newsletterOptIn).toBe(false);
    expect(submitted.propertyMatchOptIn).toBe(false);
    expect(host.textContent).not.toContain("Brochure request saved");
    expect(calls.readiness).toHaveBeenCalledWith(true);
    expect(calls.track).toHaveBeenCalled();
    expect(host.textContent).not.toContain("Selected brochure email preview");
    expect(host.textContent).not.toContain("Demo complete");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("retains the three-stage general enquiry and its property preferences", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await renderForm(false);
    expect(host.querySelectorAll('ol[aria-label="Enquiry progress"] li')).toHaveLength(3);
    expect(host.querySelector("details")).toBeNull();
    await enterDetails();
    await acknowledgePrivacy();
    await next();
    expect(host.textContent).toContain("How can we help?");
    expect(host.querySelectorAll('input[type="radio"]')).toHaveLength(5);
    expect(calls.submit).not.toHaveBeenCalled();
    await next();
    expect(host.textContent).toContain("Shape your search");
    expect(host.querySelector("details")).toBeNull();
    expect(host.querySelector('select[id$="-bedrooms"]')).not.toBeNull();
    expect(calls.submit).not.toHaveBeenCalled();
    await next();
    expect(calls.submit).toHaveBeenCalledOnce();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
