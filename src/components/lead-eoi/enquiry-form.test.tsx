// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnquiryForm } from "./enquiry-form";
import type { InteriorEnquiryContext } from "@/lib/interiors-enquiry";

const tracking = vi.hoisted(() => ({ event: vi.fn() }));
vi.mock("./analytics", () => ({ trackLeadEvent: tracking.event }));
vi.mock("./attribution", () => ({
  primeLeadAttribution: vi.fn(),
  getLeadAttribution: () => ({ surface: "query_page", pagePath: "/enquire" }),
}));

let root: Root;
let host: HTMLDivElement;
const fetcher = vi.fn();
const flows: Array<[string, InteriorEnquiryContext | undefined]> = [
  ["general", undefined],
  ["interiors", { goal: "renovate", room: "kitchen" }],
];

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", fetcher);
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

async function input(suffix: string, value: string) {
  const field = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[id$="-${suffix}"]`)!;
  await act(async () => {
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function renderAndFill(interiors?: InteriorEnquiryContext, privacy = true) {
  await act(async () => root.render(<EnquiryForm interiors={interiors} />));
  await input("message", "Please tell me about this service.");
  await input("firstName", "Alex");
  await input("email", "alex@example.test");
  if (privacy) {
    await act(async () => host.querySelector<HTMLInputElement>('input[id$="-privacyAcknowledged"]')!.click());
  }
}

async function submit() {
  await act(async () => {
    host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

function body(index: number) {
  return JSON.parse(String(fetcher.mock.calls[index][1].body));
}

function accept(_url: unknown, init: RequestInit, status: "created" | "duplicate" = "created") {
  const request = JSON.parse(String(init.body));
  return Response.json({ success: true, status, leadId: "synthetic-lead", submissionId: request.submissionId });
}

function successEvents() {
  return tracking.event.mock.calls.filter(([name]) => name === "lead_submit_success");
}

describe("general and interiors enquiry submission", () => {
  it.each(flows)("recovers an unchanged %s enquiry after the saved response is lost", async (_name, interiors) => {
    fetcher.mockRejectedValueOnce(new Error("response lost after save"))
      .mockImplementationOnce((_url, init) => accept(_url, init, "duplicate"));
    await renderAndFill(interiors);
    await submit();
    expect(host.textContent).toContain("couldn’t confirm");
    expect(successEvents()).toHaveLength(0);
    expect(host.querySelector<HTMLInputElement>('input[id$="-email"]')!.value).toBe("alex@example.test");
    await submit();
    expect(body(1).submissionId).toBe(body(0).submissionId);
    expect(body(1).newsletterOptIn).toBe(false);
    expect(body(1).propertyMatchOptIn).toBe(false);
    if (interiors) expect(body(1).contact.message).toContain("Kitchen");
    expect(host.textContent).toContain("Your question has been received.");
    expect(successEvents()).toHaveLength(1);
  });

  it.each(flows)("assigns a new reference after a visitor edits a failed %s enquiry", async (_name, interiors) => {
    fetcher.mockRejectedValueOnce(new Error("response lost after save"))
      .mockImplementationOnce(accept);
    await renderAndFill(interiors);
    await submit();
    await input("message", "I have a different question about a renovation.");
    await input("email", "updated@example.test");
    await submit();
    expect(body(1).submissionId).not.toBe(body(0).submissionId);
    expect(body(1).contact.email).toBe("updated@example.test");
    expect(body(1).contact.message).toContain("different question");
    expect(host.textContent).toContain("Your question has been received.");
    expect(successEvents()).toHaveLength(1);
  });

  it("requires a matching durable receipt before showing or tracking success", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({ success: true, status: "created", leadId: "synthetic-lead", submissionId: "unrelated" }))
      .mockImplementationOnce(accept);
    await renderAndFill();
    await submit();
    await submit();
    expect(host.textContent).not.toContain("Your question has been received.");
    expect(successEvents()).toHaveLength(0);
    await submit();
    expect(new Set([body(0).submissionId, body(1).submissionId, body(2).submissionId]).size).toBe(1);
    expect(successEvents()).toHaveLength(1);
  });

  it("keeps local privacy validation ahead of any request", async () => {
    await renderAndFill(undefined, false);
    await submit();
    expect(fetcher).not.toHaveBeenCalled();
    expect(host.textContent).toContain("Confirm that you have read and understood the privacy notice.");
  });
});
