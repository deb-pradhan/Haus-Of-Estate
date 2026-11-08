import {
  LEAD_FORM_VERSION,
  PRIVACY_NOTICE_VERSION,
  leadIntakeV2Schema,
  type LeadIntakeV2Input,
} from '@/lib/lead-intake/contract'
import { buildLeadDeliveryPayload } from '@/lib/lead-delivery/payload'
import { LEAD_NOTIFICATION_SUBJECT, leadNotificationText } from '@/lib/lead-delivery/notification-text'
import { launchProjectTitle, type LaunchInterest } from '@/lib/launches/registry'

/**
 * Simulated launch registration for the protected showcase.
 *
 * It builds the same payload the live launch-article form sends, validates it
 * against the native intake contract, resolves the launch the way the server
 * would, and renders the real sales-notification text. Nothing is saved, sent
 * or subscribed; the output only proves what the team would receive.
 */

export interface SimulatedLaunchRegistrationInput {
  launch: LaunchInterest
  interest: 'buy' | 'invest'
  preferences: { propertyType?: string; bedrooms?: string; timeframe?: string }
  contact: { firstName: string; email: string; phone?: string; message?: string }
  privacyAcknowledged: boolean
  propertyMatchOptIn: boolean
  newsletterOptIn: boolean
  /** The live article path the form would run on; the showcase path is never attributed. */
  pagePath: string
  submissionId?: string
  now?: Date
}

export type SimulatedLaunchField = 'firstName' | 'email' | 'phone' | 'message' | 'privacyAcknowledged' | 'form'
export type SimulatedLaunchErrors = Partial<Record<SimulatedLaunchField, string>>

export type SimulatedLaunchResult =
  | {
      ok: true
      payload: LeadIntakeV2Input
      saved: { project: string; source: string; campaign: string; landingPage: string }
      notification: { to: string; subject: string; replyTo: string; text: string }
      optIns: { propertyMatch: boolean; newsletter: boolean }
    }
  | { ok: false; errors: SimulatedLaunchErrors }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/
export const SIMULATED_NOTIFICATION_TO = 'sales@hausofestate.com'

export function validateSimulatedLaunchFields(input: SimulatedLaunchRegistrationInput): SimulatedLaunchErrors {
  const errors: SimulatedLaunchErrors = {}
  const firstName = input.contact.firstName.trim()
  const email = input.contact.email.trim()
  const phone = input.contact.phone?.trim() ?? ''
  if (!firstName) errors.firstName = 'Enter your first name.'
  else if (firstName.length > 80) errors.firstName = 'Use 80 characters or fewer.'
  if (!email) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.email = 'Enter a valid email address.'
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number or leave this blank.'
  if ((input.contact.message?.length ?? 0) > 2000) errors.message = 'Use 2,000 characters or fewer.'
  if (!input.privacyAcknowledged) errors.privacyAcknowledged = 'Confirm that you have read and understood the privacy notice.'
  return errors
}

function newSubmissionId(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID()
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (char) =>
    (Number(char) ^ (Math.floor(Math.random() * 16) & (15 >> (Number(char) / 4)))).toString(16))
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const CONTACT_FIELDS: ReadonlySet<string> = new Set(['firstName', 'email', 'phone', 'message', 'privacyAcknowledged'])

function contractField(path: PropertyKey[]): SimulatedLaunchField {
  const last = String(path[path.length - 1] ?? '')
  return CONTACT_FIELDS.has(last) ? (last as SimulatedLaunchField) : 'form'
}

export function buildSimulatedLaunchRegistration(input: SimulatedLaunchRegistrationInput): SimulatedLaunchResult {
  const fieldErrors = validateSimulatedLaunchFields(input)
  if (Object.keys(fieldErrors).length) return { ok: false, errors: fieldErrors }

  const preferences = {
    market: input.launch.country,
    location: `${input.launch.community}, ${input.launch.city}`,
    propertyType: optional(input.preferences.propertyType),
    bedrooms: optional(input.preferences.bedrooms),
    timeframe: optional(input.preferences.timeframe),
  }
  const candidate = {
    submissionId: input.submissionId ?? newSubmissionId(),
    interest: input.interest,
    preferences,
    launchInterest: { key: input.launch.key },
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
    context: { surface: 'launch_article' as const, pagePath: input.pagePath.slice(0, 500) || '/' },
  }
  const parsed = leadIntakeV2Schema.safeParse(candidate)
  if (!parsed.success) {
    const errors: SimulatedLaunchErrors = {}
    for (const issue of parsed.error.issues) errors[contractField(issue.path)] ??= issue.message
    return { ok: false, errors }
  }

  // Mirrors persistence: the launch resolves to the lead's project, source is
  // the surface without UTMs, and the campaign cell defaults to the launch key.
  const project = launchProjectTitle(input.launch)
  const source = parsed.data.context.surface
  const campaign = input.launch.key
  const submittedAt = input.now ?? new Date()
  const delivery = buildLeadDeliveryPayload({
    eventId: `simulated-${parsed.data.submissionId}`,
    leadId: `simulated-${parsed.data.submissionId.slice(0, 8)}`,
    submittedAt,
    firstName: parsed.data.contact.firstName,
    email: parsed.data.contact.email,
    phone: parsed.data.contact.phone,
    interest: parsed.data.interest,
    market: preferences.market,
    location: preferences.location,
    propertyType: preferences.propertyType,
    bedrooms: preferences.bedrooms,
    timeframe: preferences.timeframe,
    project,
    propertyMatchOptIn: parsed.data.propertyMatchOptIn,
    newsletterOptIn: parsed.data.newsletterOptIn,
    overseasCashBuyer: false,
    source,
    campaign,
    landingPage: parsed.data.context.pagePath,
    message: parsed.data.contact.message,
  })

  return {
    ok: true,
    payload: parsed.data,
    saved: { project, source, campaign, landingPage: delivery.row.landingPage },
    notification: {
      to: SIMULATED_NOTIFICATION_TO,
      subject: LEAD_NOTIFICATION_SUBJECT,
      replyTo: parsed.data.contact.email,
      text: leadNotificationText(delivery),
    },
    optIns: { propertyMatch: parsed.data.propertyMatchOptIn, newsletter: parsed.data.newsletterOptIn },
  }
}
