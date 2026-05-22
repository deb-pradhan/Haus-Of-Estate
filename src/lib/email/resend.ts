import { Resend } from "resend";

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

export async function sendWelcomeEmail(to: string, name: string) {
  const client = getResend();
  if (!client) return { success: true, mock: true };
  return client.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Haus of Estate",
    html: `<h1>Welcome, ${name}</h1>
<p>Thank you for joining Haus of Estate. Your account has been created successfully.</p>
<p>We'll be in touch within 2 hours with property opportunities tailored to your needs.</p>`,
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
    html: `<p>Hi ${name},</p>
<p>We noticed a new sign-in to your account.</p>
<p><strong>Device/Browser:</strong> ${device}</p>
<p>If this wasn't you, please contact us immediately at ${ADMIN}.</p>`,
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

export async function sendLeadNotificationToAdmin(lead: {
  email: string;
  firstName: string;
  intent: string;
  tier: string | null;
  score: number;
  phone?: string | null;
}) {
  const tierEmoji =
    lead.tier === "hot" ? "🔥" : lead.tier === "warm" ? "📈" : "🌱";
  const client = getResend();
  if (!client) return { success: true, mock: true };
  return client.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `${tierEmoji} New ${(lead.tier ?? "unknown").toUpperCase()} Lead: ${lead.firstName} (${lead.intent}) — Score: ${lead.score}`,
    html: `<h2>New Lead Notification</h2>
<table style="border-collapse:collapse">
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.firstName}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.phone ?? "—"}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Intent</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.intent}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Tier</strong></td><td style="padding:8px;border:1px solid #ddd">${(lead.tier ?? "unknown").toUpperCase()}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Score</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.score}</td></tr>
</table>`,
  });
}