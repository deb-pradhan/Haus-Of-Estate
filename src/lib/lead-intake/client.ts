export interface LeadSubmissionAttempt {
  payload: string;
  submissionId: string;
}

export interface LeadSubmissionReceipt {
  success: true;
  status: "created" | "duplicate";
  leadId: string;
  submissionId: string;
}

const SAVE_ERROR = "We couldn’t confirm your enquiry was saved. Your details are still here. Please try again, or email info@hausofestate.com.";

export function isLeadSubmissionReceipt(value: unknown, submissionId: string): value is LeadSubmissionReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<LeadSubmissionReceipt>;
  return receipt.success === true && ["created", "duplicate"].includes(receipt.status ?? "") &&
    typeof receipt.leadId === "string" && receipt.leadId.length > 0 && receipt.submissionId === submissionId;
}

/** Retain the reference after ambiguous failures, but use a new one if the visitor edits the enquiry. */
export async function submitLeadEnquiry(
  payload: Record<string, unknown>,
  attempt: { current: LeadSubmissionAttempt | null },
  fetchImplementation: typeof fetch = fetch,
): Promise<LeadSubmissionReceipt> {
  const serialized = JSON.stringify(payload);
  if (!attempt.current || attempt.current.payload !== serialized) {
    attempt.current = { payload: serialized, submissionId: crypto.randomUUID() };
  }
  const submissionId = attempt.current.submissionId;
  let response: Response;
  try {
    response = await fetchImplementation("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({ ...payload, submissionId }),
    });
  } catch {
    throw new Error(SAVE_ERROR);
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || !isLeadSubmissionReceipt(result, submissionId)) {
    throw new Error(response.status === 429
      ? "Please wait a few minutes before trying again. Your details are still here."
      : SAVE_ERROR);
  }
  return result;
}
