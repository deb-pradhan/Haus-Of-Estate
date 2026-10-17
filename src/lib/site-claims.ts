/**
 * Single source of truth for claims the site makes about itself.
 *
 * Rule: nothing in here may state a number, rating, registration or service
 * level that the business cannot evidence. Where a fact is not yet verified the
 * value is null and the copy simply omits it. Change the value here and every
 * form, email and page follows.
 */

/**
 * Operational response-time guarantee, in working hours. Leave null until the
 * founder confirms a figure the team can honour every time. While null, copy
 * never mentions a number.
 */
export const RESPONSE_HOURS: number | null = null;

/** Short phrase for use inside a sentence: "We will reply ${RESPONSE_TIME_COPY}." */
export const RESPONSE_TIME_COPY: string =
  RESPONSE_HOURS === null
    ? "as soon as we can"
    : `within ${RESPONSE_HOURS} working hours`;

/** "We will reply as soon as we can." */
export const RESPONSE_SENTENCE = `We will reply ${RESPONSE_TIME_COPY}.`;

/** Honest success message once an enquiry has been accepted by the server. */
export const ENQUIRY_RECEIVED_COPY = `We have received your enquiry and will reply ${RESPONSE_TIME_COPY}.`;

/** Shown when a submission fails. Never pretend the enquiry was received. */
export const ENQUIRY_FAILED_COPY =
  "We could not send your enquiry just now. Please check your connection and try again, or email us instead.";

/** Fee and referral disclosure (replaces "no hidden fees"). */
export const FEE_DISCLOSURE_COPY =
  "Our introductions are free to you. We may receive a referral fee from the agent or developer you choose, and we will tell you before you proceed.";

/** How introductions work, stated neutrally (replaces "vetted agents only"). */
export const INTRODUCER_ROLE_COPY =
  "We aim to introduce you only to estate agents, brokers and developers who are licensed to trade in their market. We are not a party to your purchase, sale or tenancy.";

/** Privacy contact (already published in the previous policy). FOUNDER: confirm this mailbox exists and is monitored. */
export const PRIVACY_CONTACT_EMAIL = "privacy@hausofestate.com";

/** Current version of the notice / marketing wording shown on forms. Bump on any wording change. */
export const CONSENT_TEXT_VERSION = "2026-10-18";

/**
 * Longest period, in weeks, before we send a final response to a complaint.
 * Eight weeks is the point at which UK property redress schemes let a
 * complainant escalate. FOUNDER: confirm the team can honour this.
 */
export const COMPLAINT_FINAL_RESPONSE_WEEKS = 8;
