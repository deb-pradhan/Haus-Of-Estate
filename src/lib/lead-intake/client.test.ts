import { describe, expect, it, vi } from "vitest";
import { isLeadSubmissionReceipt, LeadSubmissionError, submitLeadEnquiry, type LeadSubmissionAttempt } from "./client";

const attempt = () => ({ current: null as LeadSubmissionAttempt | null });
const payload = { intent: "account", email: "person@example.test" };
const accepted = (_url: unknown, init?: RequestInit) => {
  const body = JSON.parse(String(init?.body));
  return Promise.resolve(Response.json({ success: true, status: "created", leadId: "saved-lead", submissionId: body.submissionId }, { status: 201 }));
};

describe("enquiry receipt client", () => {
  it("never accepts an HTTP failure, malformed response or unrelated receipt as success", async () => {
    for (const response of [
      Response.json({ success: true }, { status: 503 }),
      Response.json({ success: false }), new Response("not JSON"),
      Response.json({ success: true, status: "created", leadId: "lead", submissionId: "wrong-reference" }),
    ]) {
      await expect(submitLeadEnquiry(payload, attempt(), vi.fn().mockResolvedValue(response))).rejects.toThrow("couldn’t confirm");
    }
  });

  it("reuses a submission ID after an uncertain network failure and changes it only for edited data", async () => {
    const reference = attempt();
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("connection lost")).mockImplementation(accepted);
    await expect(submitLeadEnquiry(payload, reference, fetcher)).rejects.toThrow("details are still here");
    await expect(submitLeadEnquiry(payload, reference, fetcher)).resolves.toMatchObject({ leadId: "saved-lead" });
    await submitLeadEnquiry({ ...payload, email: "changed@example.test" }, reference, fetcher);
    const ids = fetcher.mock.calls.map((call) => JSON.parse(String(call[1].body)).submissionId);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[1]);
  });

  it("keeps rate-limit errors actionable without claiming receipt", async () => {
    await expect(submitLeadEnquiry(payload, attempt(), vi.fn().mockResolvedValue(new Response(null, { status: 429 })))).rejects.toThrow("wait a few minutes");
  });

  it("accepts a queued brochure receipt only as a boolean on the matching durable receipt", async () => {
    const receipt = { success: true, status: "duplicate", leadId: "saved-lead", submissionId: "same-request" };
    expect(isLeadSubmissionReceipt({ ...receipt, brochureQueued: true }, "same-request")).toBe(true);
    expect(isLeadSubmissionReceipt({ ...receipt, brochureQueued: "sent" }, "same-request")).toBe(false);
    expect(isLeadSubmissionReceipt({ ...receipt, brochureQueued: true, leadId: "" }, "same-request")).toBe(false);
    const fetcher = vi.fn().mockImplementation((_url, init) => {
      const request = JSON.parse(String(init?.body));
      expect(request.brochure).toEqual({ designId: "type-a" });
      expect(request.propertyMatchOptIn).toBe(false);
      expect(request.newsletterOptIn).toBe(false);
      return Response.json({ ...receipt, submissionId: request.submissionId, brochureQueued: true });
    });
    await expect(submitLeadEnquiry({
      project: { slug: "florence-villas" },
      brochure: { designId: "type-a" },
      propertyMatchOptIn: false,
      newsletterOptIn: false,
    }, attempt(), fetcher)).resolves.toMatchObject({ brochureQueued: true, status: "duplicate" });
  });

  it("directs uncertain saves to the sales inbox and accepts the follow-up flag only as a boolean", async () => {
    const failure = await submitLeadEnquiry(payload, attempt(), vi.fn().mockRejectedValue(new Error("offline"))).catch((error: Error) => error);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain("sales@hausofestate.com");
    expect((failure as Error).message).not.toContain("info@hausofestate.com");
    const receipt = { success: true, status: "created", leadId: "saved-lead", submissionId: "same-request" };
    expect(isLeadSubmissionReceipt({ ...receipt, brochureDeliveryFailed: true }, "same-request")).toBe(true);
    expect(isLeadSubmissionReceipt({ ...receipt, brochureDeliveryFailed: "yes" }, "same-request")).toBe(false);
    const fetcher = vi.fn().mockImplementation((_url, init) => {
      const request = JSON.parse(String(init?.body));
      return Response.json({ ...receipt, submissionId: request.submissionId, brochureDeliveryFailed: true }, { status: 201 });
    });
    const saved = await submitLeadEnquiry({ project: { slug: "florence-villas" }, brochure: { designId: "type-a" } }, attempt(), fetcher);
    expect(saved).toMatchObject({ status: "created", brochureDeliveryFailed: true });
    expect(saved).not.toHaveProperty("brochureQueued");
  });

  it("surfaces actionable validation errors without displaying arbitrary server content", async () => {
    const failure = Response.json({
      error: "internal secret must not be displayed",
      fieldErrors: { brochure: ["internal secret"], unrelated: ["internal path"] },
    }, { status: 400 });
    const promise = submitLeadEnquiry(payload, attempt(), vi.fn().mockResolvedValue(failure));
    await expect(promise).rejects.toBeInstanceOf(LeadSubmissionError);
    await expect(promise).rejects.toMatchObject({
      fieldErrors: { brochure: expect.stringContaining("ordinary property enquiry") },
      message: expect.not.stringContaining("internal"),
    });
  });
});
