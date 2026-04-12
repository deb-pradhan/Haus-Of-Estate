import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Haus of Estate <noreply@hausofestate.com>";
const ADMIN = process.env.ADMIN_EMAIL ?? "admin@hausofestate.com";

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
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
  return resend.emails.send({
    from: FROM,
    to,
    subject: "New login to your Haus of Estate account",
    html: `<p>Hi ${name},</p>
<p>We noticed a new sign-in to your account.</p>
<p><strong>Device/Browser:</strong> ${device}</p>
<p>If this wasn't you, please contact us immediately at ${ADMIN}.</p>`,
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
  return resend.emails.send({
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