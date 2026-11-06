import {
  LEAD_FORM_VERSION,
  PRIVACY_NOTICE_VERSION,
  leadIntakeV2Schema,
  type LeadIntakeV2Input,
} from '@/lib/lead-intake/contract'
import { renderBrochureEmail } from '@/lib/email/brochure'

/**
 * Simulated brochure request.
 *
 * The showcase never calls the lead or email endpoints. It builds the same
 * payload the native intake contract accepts, validates it with that contract,
 * and renders the real brochure email template with an inert download link,
 * so the journey proves the shape of a request without saving or sending.
 */

export const SIMULATED_BROCHURE_REVISION = 'fixture-showcase-simulation'
export const SIMULATED_DOWNLOAD_HREF = '#simulated-download-link'

export interface SimulatedBrochureRequestInput {
  project: { slug: string; title: string }
  design: { id: string; label: string; brochureKey: string }
  contact: { firstName: string; email: string; phone?: string; message?: string }
  privacyAcknowledged: boolean
  propertyMatchOptIn: boolean
  newsletterOptIn: boolean
  pagePath: string
  submissionId?: string
}

export type SimulatedBrochureField = 'firstName' | 'email' | 'phone' | 'message' | 'privacyAcknowledged' | 'form'
export type SimulatedBrochureErrors = Partial<Record<SimulatedBrochureField, string>>

export interface SimulatedBrochureEmail {
  to: string
  subject: string
  html: string
  text: string
}

export type SimulatedBrochureResult =
  | {
      ok: true
      payload: LeadIntakeV2Input
      email: SimulatedBrochureEmail
      optIns: { propertyMatch: boolean; newsletter: boolean }
    }
  | { ok: false; errors: SimulatedBrochureErrors }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/

/** Friendly field checks mirroring the native form, run before the contract. */
export function validateSimulatedBrochureFields(input: SimulatedBrochureRequestInput): SimulatedBrochureErrors {
  const errors: SimulatedBrochureErrors = {}
  const firstName = input.contact.firstName.trim()
  const email = input.contact.email.trim()
  const phone = input.contact.phone?.trim() ?? ''
  if (!firstName) errors.firstName = 'Enter your first name.'
  else if (firstName.length > 80) errors.firstName = 'Use 80 characters or fewer.'
  if (!email) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.email = 'Enter a valid email address.'
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number or leave this blank.'
  if ((input.contact.message?.length ?? 0) > 2000) errors.message = 'Use 2,000 characters or fewer.'
  if (!input.privacyAcknowledged) {
    errors.privacyAcknowledged = 'Confirm that you have read and understood the privacy notice.'
  }
  return errors
}

function newSubmissionId(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID()
  // Deterministic-looking fallback for very old runtimes; still a valid v4 shape.
  const hex = () => Math.floor(Math.random() * 16).toString(16)
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (char) =>
    (Number(char) ^ (Math.floor(Math.random() * 16) & (15 >> (Number(char) / 4)))).toString(16) || hex())
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function contractField(path: PropertyKey[]): SimulatedBrochureField {
  const last = String(path[path.length - 1] ?? '')
  if (['firstName', 'email', 'phone', 'message', 'privacyAcknowledged'].includes(last)) {
    return last as SimulatedBrochureField
  }
  return 'form'
}

/** Email HTML stays faithful to the template but cannot load remote content or follow links. */
export function neutralizeEmailHtml(html: string): string {
  const safety = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><style>a{pointer-events:none;cursor:default}</style>'
  return html.includes('<head>') ? html.replace('<head>', `<head>${safety}`) : `${safety}${html}`
}

export function buildSimulatedBrochureRequest(input: SimulatedBrochureRequestInput): SimulatedBrochureResult {
  const fieldErrors = validateSimulatedBrochureFields(input)
  if (Object.keys(fieldErrors).length) return { ok: false, errors: fieldErrors }

  const candidate = {
    submissionId: input.submissionId ?? newSubmissionId(),
    interest: 'buy',
    project: { slug: input.project.slug },
    brochure: { designId: input.design.id },
    contact: {
      firstName: input.contact.firstName.trim(),
      email: input.contact.email.trim().toLowerCase(),
      phone: optional(input.contact.phone),
      message: optional(input.contact.message),
    },
    privacyAcknowledged: input.privacyAcknowledged,
    propertyMatchOptIn: input.propertyMatchOptIn,
    newsletterOptIn: input.newsletterOptIn,
    overseasCashBuyer: false,
    formVersion: LEAD_FORM_VERSION,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    context: { surface: 'manual_cta', pagePath: input.pagePath.slice(0, 500) || '/showcase' },
  }
  const parsed = leadIntakeV2Schema.safeParse(candidate)
  if (!parsed.success) {
    const errors: SimulatedBrochureErrors = {}
    for (const issue of parsed.error.issues) {
      const field = contractField(issue.path)
      errors[field] ??= issue.message
    }
    return { ok: false, errors }
  }

  const rendered = renderBrochureEmail({
    key: input.design.brochureKey,
    revision: SIMULATED_BROCHURE_REVISION,
    projectSlug: input.project.slug,
    projectTitle: input.project.title,
    designId: input.design.id,
    designLabel: input.design.label,
    recipientName: parsed.data.contact.firstName,
    recipientEmail: parsed.data.contact.email,
  }, SIMULATED_DOWNLOAD_HREF)

  return {
    ok: true,
    payload: parsed.data,
    email: {
      to: parsed.data.contact.email,
      subject: rendered.subject,
      html: neutralizeEmailHtml(rendered.html),
      text: rendered.text,
    },
    optIns: { propertyMatch: parsed.data.propertyMatchOptIn, newsletter: parsed.data.newsletterOptIn },
  }
}
