import { Resend } from "resend";
import { COMPANY_IDENTITY } from "@/lib/company-identity";
import { RESPONSE_TIME_COPY } from "@/lib/site-claims";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "re_xxx") {
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM = "Haus of Estate <noreply@hausofestate.com>";
const ADMIN = process.env.ADMIN_EMAIL ?? "admin@hausofestate.com";
// Applications and CVs land in the HR mailbox.
const CAREERS_INBOX = process.env.CAREERS_EMAIL ?? "hr@hausofestate.com";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Companies Act s82: business emails carry name, number and registered office. */
const EMAIL_FOOTER = `<p style="font-family:system-ui,sans-serif;font-size:12px;color:#5b5f66;margin-top:24px">${escapeHtml(COMPANY_IDENTITY.name)} is a trading name of ${escapeHtml(COMPANY_IDENTITY.legalName)}, registered in ${escapeHtml(COMPANY_IDENTITY.registeredJurisdiction)} (company number ${escapeHtml(COMPANY_IDENTITY.number)}). Registered office: ${escapeHtml(COMPANY_IDENTITY.registeredOffice)}.</p>`;

/** Strip line breaks so user text can never inject extra email headers. */
function singleLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ").trim();
}

export async function sendWelcomeEmail(to: string, name: string) {
  const client = getResend();
  if (!client) return { success: true, mock: true };
  return client.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Haus of Estate",
    html: `<h1>Welcome, ${escapeHtml(name)}</h1>
<p>Thank you for joining Haus of Estate. Your account has been created.</p>
<p>If you have sent us an enquiry, we will reply ${escapeHtml(RESPONSE_TIME_COPY)}.</p>
${EMAIL_FOOTER}`,
  });
}

export async function sendLoginAlertEmail(
  to: string,
  name: string,
  device: string
) {
  const client = getResend();
  if (!client) return { success: true, mock: true };
  return client.emails.send({
    from: FROM,
    to,
    subject: "New login to your Haus of Estate account",
    html: `<p>Hi ${escapeHtml(name)},</p>
<p>We noticed a new sign-in to your account.</p>
<p><strong>Device/Browser:</strong> ${escapeHtml(device)}</p>
<p>If this wasn't you, please contact us immediately at ${escapeHtml(ADMIN)}.</p>
${EMAIL_FOOTER}`,
  });
}

// ── Careers ──────────────────────────────────────────────────────────

export interface CvAttachment {
  filename: string;
  /** Base64-encoded file content. */
  content: string;
}

export interface ApplicationPayload {
  roleSlug: string;
  roleTitle: string;
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  yearsOfExperience: string;
  experienceAreas?: string[];
  opportunityType?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  coverNote?: string;
  cv?: CvAttachment;
}

export async function sendApplicationToTeam(app: ApplicationPayload) {
  const client = getResend();
  if (!client) return { success: true, mock: true };

  const rows: Array<[string, string]> = [
    ["Role applied for", `${escapeHtml(app.roleTitle)} (${escapeHtml(app.roleSlug)})`],
  ];
  if (app.opportunityType) {
    rows.push(["Opportunity type", escapeHtml(app.opportunityType)]);
  }
  rows.push(
    ["Name", escapeHtml(app.fullName)],
    ["Email", `<a href="mailto:${escapeHtml(app.email)}">${escapeHtml(app.email)}</a>`],
    ["Phone", escapeHtml(app.phone)],
    ["Location", escapeHtml(app.location ?? "—")],
    ["Years of experience", escapeHtml(app.yearsOfExperience)],
  );
  if (app.experienceAreas && app.experienceAreas.length > 0) {
    rows.push([
      "Areas of experience",
      escapeHtml(app.experienceAreas.join(", ")),
    ]);
  }
  rows.push(
    [
      "LinkedIn",
      app.linkedinUrl
        ? `<a href="${escapeHtml(app.linkedinUrl)}">${escapeHtml(app.linkedinUrl)}</a>`
        : "—",
    ],
    [
      "Portfolio / Showreel",
      app.portfolioUrl
        ? `<a href="${escapeHtml(app.portfolioUrl)}">${escapeHtml(app.portfolioUrl)}</a>`
        : "—",
    ],
    ["CV attached", app.cv ? escapeHtml(app.cv.filename) : "— (none)"],
  );

  const rowsHtml = rows
    .map(
      ([label, val]) =>
        `<tr><td style="padding:8px;border:1px solid #ddd;background:#f7f5f1"><strong>${label}</strong></td><td style="padding:8px;border:1px solid #ddd">${val}</td></tr>`,
    )
    .join("");

  const coverHtml = app.coverNote
    ? `<h3 style="font-family:Georgia,serif;color:#1f4f2f;margin-top:24px">Cover note</h3>
<p style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap;background:#f7f5f1;padding:14px;border-radius:8px">${escapeHtml(app.coverNote)}</p>`
    : "";

  return client.emails.send({
    from: FROM,
    to: CAREERS_INBOX,
    replyTo: app.email,
    subject: `New application — ${app.roleTitle} (${app.fullName})`,
    html: `<h2 style="font-family:Georgia,serif;color:#1f4f2f">New career application</h2>
<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">${rowsHtml}</table>
${coverHtml}`,
    attachments: app.cv
      ? [{ filename: app.cv.filename, content: app.cv.content }]
      : undefined,
  });
}

export async function sendApplicationConfirmationToApplicant(app: ApplicationPayload) {
  const client = getResend();
  if (!client) return { success: true, mock: true };
  return client.emails.send({
    from: FROM,
    to: app.email,
    subject: `We've received your application — ${app.roleTitle}`,
    html: `<p style="font-family:system-ui,sans-serif">Hi ${escapeHtml(app.fullName.split(" ")[0])},</p>
<p style="font-family:system-ui,sans-serif">Thank you for applying for the <strong>${escapeHtml(app.roleTitle)}</strong> role at Haus of Estate. Your application is in front of our team and we'll be in touch within two working days, either to invite you to a first conversation or to let you know it isn't a fit this time.</p>
<p style="font-family:system-ui,sans-serif">In the meantime, no follow-up needed — we read every application.</p>
<p style="font-family:system-ui,sans-serif">— The Haus of Estate team</p>`,
  });
}

export interface LeadNotification {
  email: string;
  firstName: string;
  surname?: string | null;
  intent: string;
  tier: string | null;
  score: number;
  phone?: string | null;
  /** Enquiry details (market, area, budget, ...). Escaped before rendering. */
  details?: Record<string, string | null | undefined>;
  /**
   * Consent evidence. The database has no marketing-consent columns yet, so
   * this email is currently the only record of the marketing opt-in.
   */
  consent?: {
    notice: boolean;
    marketing: boolean;
    channels: string[];
    textVersion?: string;
    at: string;
    sourcePage?: string;
  };
}

export interface DeliveryResult {
  /** True only when the email provider accepted the message. */
  delivered: boolean;
  /** True when no email provider is configured (nothing was sent). */
  mock?: boolean;
}

export async function sendLeadNotificationToAdmin(
  lead: LeadNotification,
): Promise<DeliveryResult> {
  const client = getResend();
  if (!client) return { delivered: false, mock: true };

  const cell = "padding:8px;border:1px solid #ddd";
  const row = (label: string, value: string) =>
    `<tr><td style="${cell}"><strong>${escapeHtml(label)}</strong></td><td style="${cell}">${value}</td></tr>`;

  const fullName = [lead.firstName, lead.surname].filter(Boolean).join(" ");
  const rows = [
    row("Name", escapeHtml(fullName)),
    row(
      "Email",
      `<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>`,
    ),
    row("Phone", escapeHtml(lead.phone ?? "—")),
    row("Intent", escapeHtml(lead.intent)),
    row("Tier", escapeHtml((lead.tier ?? "unknown").toUpperCase())),
    row("Score", String(lead.score)),
  ];
  for (const [label, value] of Object.entries(lead.details ?? {})) {
    if (value) rows.push(row(label, escapeHtml(value)));
  }
  if (lead.consent) {
    const c = lead.consent;
    rows.push(
      row("Privacy notice shown", c.notice ? "Yes" : "No"),
      row(
        "Marketing opt-in",
        c.marketing ? `Yes (${escapeHtml(c.channels.join(", "))})` : "No. Do not send marketing.",
      ),
      row("Wording version", escapeHtml(c.textVersion ?? "unknown")),
      row("Recorded at (UTC)", escapeHtml(c.at)),
      row("Source page", escapeHtml(c.sourcePage ?? "unknown")),
    );
  }

  const tierLabel = (lead.tier ?? "unknown").toUpperCase();
  const result = await client.emails.send({
    from: FROM,
    to: ADMIN,
    replyTo: lead.email,
    subject: singleLine(
      `New ${tierLabel} lead: ${fullName} (${lead.intent}), score ${lead.score}`,
    ),
    html: `<h2>New lead notification</h2>
<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">${rows.join("")}</table>`,
  });
  // The Resend SDK resolves with { error } rather than throwing.
  const error = (result as { error?: unknown } | undefined)?.error;
  return { delivered: !error };
}
