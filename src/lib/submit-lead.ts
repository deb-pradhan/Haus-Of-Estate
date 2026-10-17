import { CONSENT_TEXT_VERSION, ENQUIRY_FAILED_COPY } from "@/lib/site-claims";

export interface LeadSubmission {
  /** Free-form enquiry fields understood by POST /api/leads. */
  fields: Record<string, unknown>;
  /** Optional, unticked-by-default marketing opt-in. */
  marketingConsent: boolean;
}

export type LeadResult =
  | { ok: true; leadId?: string }
  | { ok: false; error: string };

/**
 * Client-side helper for POST /api/leads. Always sends `consentNotice: true`
 * (every caller shows the privacy notice beside the submit button) and never
 * reports success unless the server accepted the enquiry.
 */
export async function submitLead({
  fields,
  marketingConsent,
}: LeadSubmission): Promise<LeadResult> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...fields,
        consentNotice: true,
        marketingConsent,
        marketingChannels: marketingConsent ? ["email"] : [],
        consentTextVersion: CONSENT_TEXT_VERSION,
        sourcePage:
          typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    });
    if (!res.ok) return { ok: false, error: ENQUIRY_FAILED_COPY };
    const data = (await res.json().catch(() => ({}))) as { leadId?: string };
    return { ok: true, leadId: data.leadId };
  } catch {
    return { ok: false, error: ENQUIRY_FAILED_COPY };
  }
}
