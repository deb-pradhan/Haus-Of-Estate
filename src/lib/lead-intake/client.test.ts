import { describe, expect, it, vi } from "vitest";
import { submitLeadEnquiry, type LeadSubmissionAttempt } from "./client";

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
});
