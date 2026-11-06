import type { BrochureDeliverySelection } from "@/lib/lead-delivery/types";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

/** Transactional fulfilment only; no marketing enrolment or unverified property claims. */
export function renderBrochureEmail(selection: BrochureDeliverySelection, downloadUrl: string) {
  const title = selection.projectTitle.replace(/[\r\n]/g, " ");
  const design = selection.designLabel ? `Design of interest: ${selection.designLabel}` : "";
  const text = [
    `Hello ${selection.recipientName},`,
    "",
    `Thank you for your interest in ${title}. Here is the brochure you requested.`,
    design,
    "",
    `Download your brochure: ${downloadUrl}`,
    "This download link is valid for seven days from your request. If it expires, please reply to this email.",
    "",
    "The brochure covers the collection of home designs. Your selected design records your interest; it does not reserve a home or confirm availability.",
    "Please contact our team to confirm current availability, prices and terms.",
    "",
    "You received this email because you requested this brochure. This request does not subscribe you to marketing emails.",
    "",
    "Haus of Estate",
  ].filter((line) => line !== undefined).join("\n");
  return {
    subject: `Your requested brochure — ${title}`,
    text,
    html: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>Your requested brochure</title>
<style>@media only screen and (max-width:480px){.email-shell{padding:16px 8px!important}.email-content{padding:24px 18px!important}.email-heading{font-size:25px!important}.brochure-button{display:block!important;text-align:center!important;padding:15px 12px!important}}</style></head>
<body style="margin:0;background:#f5f3ef;color:#233b32;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;overflow-wrap:break-word">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td class="email-shell" align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:600px;background:#fff;border:1px solid #ddd8cf;border-top:4px solid #1f4f2f;table-layout:fixed" cellspacing="0" cellpadding="0"><tr><td class="email-content" style="padding:36px">
<p style="margin:0 0 28px;font-size:12px;font-weight:700;letter-spacing:2px;color:#1f4f2f">HAUS OF ESTATE</p>
<p style="margin:0 0 10px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#726449">Your requested brochure</p>
<h1 class="email-heading" style="margin:0 0 26px;font-family:Georgia,serif;font-weight:400;font-size:30px;line-height:1.25;color:#1f4f2f">${escapeHtml(title)}</h1>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6">Hello ${escapeHtml(selection.recipientName)},</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6">Thank you for your interest. Here is the brochure you requested.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f5f1;border:1px solid #e4e0d8"><tr><td style="padding:18px">
<p style="margin:0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#726449">Collection brochure · PDF</p>
${design ? `<p style="margin:8px 0 0;font-size:15px;font-weight:700;line-height:1.5;color:#1f4f2f">${escapeHtml(design)}</p>` : ""}
<p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#4d5257">The brochure covers the collection of home designs. Your selected design records your interest; it does not reserve a home or confirm availability.</p>
</td></tr></table>
<p style="margin:26px 0 12px"><a class="brochure-button" href="${escapeHtml(downloadUrl)}" style="display:inline-block;background:#1f4f2f;color:#fff;padding:15px 22px;font-size:14px;font-weight:700;line-height:1.4;text-decoration:none;border-radius:4px">Download your brochure</a></p>
<p style="margin:0;font-size:12px;line-height:1.7;color:#64645e">This link is valid for seven days from your request. If it expires, please reply to this email.</p>
<p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#4d5257">Please contact our team to confirm current availability, prices and terms.</p>
<p style="margin:18px 0 0;font-family:Georgia,serif;font-size:19px;color:#1f4f2f">The Haus of Estate team</p>
<hr style="border:0;border-top:1px solid #e4e0d8;margin:28px 0 20px">
<p style="margin:0;font-size:12px;line-height:1.7;color:#64645e">You received this email because you requested this brochure. This request does not subscribe you to marketing emails.</p>
</td></tr></table></td></tr></table></body></html>`,
  };
}
