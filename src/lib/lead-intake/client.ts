export interface LeadSubmissionAttempt {
  payload: string;
  submissionId: string;
}

export interface LeadSubmissionReceipt {
  success: true;
  status: "created" | "duplicate";
  leadId: string;
  submissionId: string;
  /** A durable customer-email job exists; this does not confirm email delivery. */
  brochureQueued?: boolean;
  /** The saved request's brochure email permanently failed; the team follows up by hand. */
  brochureDeliveryFailed?: boolean;
}

const SAVE_ERROR = "We couldn’t confirm your enquiry was saved. Your details are still here. Please try again, or email sales@hausofestate.com.";

const FIELD_MESSAGES: Record<string, string> = {
  contact: "Check your name, email address, phone number and message.",
  firstName: "Enter your first name.",
  email: "Enter a valid email address.",
  phone: "Enter a valid phone number or leave this blank.",
  interest: "Choose the option that best matches your enquiry.",
  privacyAcknowledged: "Confirm that you have read and understood the privacy notice.",
  newsletterOptIn: "Choose the newsletter option to complete this subscription.",
  brochure: "Brochure email is unavailable for this selection. You can still send an ordinary property enquiry.",
  project: "This property is no longer available for this request. Please refresh the page or contact us.",
  launchInterest: "Registrations for this launch are not open right now. Please refresh the page or email sales@hausofestate.com.",
};

export class LeadSubmissionError extends Error {
  constructor(message: string, readonly fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "LeadSubmissionError";
  }
}

function submissionError(status: number, result: unknown) {
  if (status === 429) {
    return new LeadSubmissionError("Please wait a few minutes before trying again. Your details are still here.");
  }
  if (status === 400 && result && typeof result === "object" && "fieldErrors" in result) {
    const errors = result.fieldErrors;
    if (errors && typeof errors === "object") {
      // Use local, actionable copy instead of reflecting arbitrary response content.
      const fieldErrors = Object.fromEntries(
        Object.entries(FIELD_MESSAGES).filter(([key]) =>
          Array.isArray((errors as Record<string, unknown>)[key]) &&
          ((errors as Record<string, unknown[]>)[key]?.length ?? 0) > 0,
        ),
      );
      if (Object.keys(fieldErrors).length) {
        return new LeadSubmissionError(Object.values(fieldErrors).join(" "), fieldErrors);
      }
    }
  }
  return new LeadSubmissionError(SAVE_ERROR);
}

export function isLeadSubmissionReceipt(value: unknown, submissionId: string): value is LeadSubmissionReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<LeadSubmissionReceipt>;
  return receipt.success === true && ["created", "duplicate"].includes(receipt.status ?? "") &&
    typeof receipt.leadId === "string" && receipt.leadId.length > 0 && receipt.submissionId === submissionId &&
    (receipt.brochureQueued === undefined || typeof receipt.brochureQueued === "boolean") &&
    (receipt.brochureDeliveryFailed === undefined || typeof receipt.brochureDeliveryFailed === "boolean");
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
    throw submissionError(response.status, result);
  }
  return result;
}
