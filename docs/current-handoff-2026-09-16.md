# Haus of Estate — current handoff, 16 September 2026

This replaces the assumption that all 16 email workstreams are new development.
It separates prepared code, saved content, connected services and proposed work.
No production deployment, content publication or customer email happened during
this review. The work remains on the existing cumulative Release 2 branch.

## Current position

- Release 1 / PR #15 is the SEO and consented GA4-through-GTM release for Deb.
  It remains draft and unmerged. Release 2 / PR #12 includes Release 1 and the
  broader website features. No new feature branch was created.
- Accounts, saved items, careers changes, country/city search, lead capture,
  newsletter/property-match permissions, blog improvements, AskHaus, snagging
  information and currency selection have implementation in Release 2.
  This does not mean every complete customer journey is live or verified.
- Sanity is connected for website content; Florence's six image-backed drafts
  remain unpublished and paused at Surya's request. Do not restart that work.
- Four returned blog covers are now saved on the correct Sanity drafts, with
  published versions preserved. Mobile article heroes, related thumbnails and
  saved article covers now retain the full 16:9 artwork. Likith's separate
  snagging-guidelines file is still missing; do not guess its matching article.
- The original SEO audit was retrieved. The release addresses homepage
  rendering/performance causes, the duplicate hostname, broken/unapproved review
  links and consented measurement. Six code checks pass. The audit is only
  partly addressed: mobile LCP <2.5s and TBT <200ms, live deployment and real
  GA4 receipt have not been proved. Some SEO facilities and earlier fixes were
  already in main; do not credit them as new Release 1 work.

## Email system: shared understanding

Clarification checked against Git history on 17 September: **Deb's original
email integration is Resend**, introduced in `d761f468` on 12 April. Its default
staff recipient was `admin@hausofestate.com`, overridable by `ADMIN_EMAIL`.
The optional ZeptoMail adapter was added in our Release 2 work on 14 September
(`7871946e`); its template recipient `info@hausofestate.com` is not evidence of
the historical or current live inbox. Neither code path proves provider setup
or delivery. The original blog Subscribe form only opened the account modal and
did not forward its entered email or create a newsletter subscription.

Current Release 2 captures explicit newsletter requests and consent when its
hosted database is connected. Newsletter campaign sending and the public
unsubscribe/provider-sync flow remain unfinished. Do not describe that capture
as a working mailing system. The newsletter UI now says email updates are being
prepared and acknowledges saved preferences only. About/blog newsletter forms
are hidden when intake is disabled, with article links in their place, so they
cannot silently fall back to the legacy account form. Existing consent wording,
records and optional choices are preserved.

No live subscriber totals or delivery history have been established. A fresh
browser check on 17 September failed to resolve `hausofestate.com` from this PC;
the web retrieval available was four weeks old and is not proof of the current
deployment or a sitewide outage. No public signup was submitted. Deb/company
account owner needs to identify production deployment, database and sender
account, check existing subscription/lead records and delivery logs, and provide
isolated hosted test access. Sonia/marketing needs to confirm the mailing-list
and content owner and the approved newsletter service. Surya with Codex can
implement and verify the integration. First acceptance: one approved test
signup, actual inbox delivery and working unsubscribe; no customer campaign.

The intended journey is a known visitor who separately permits personalised
updates and interest capture, browses/saves relevant properties, and later gets
a useful property/article selection after inactivity. For example, a person
interested in two-bedroom Dubai apartments could receive current matching
listings after 48 hours. The delay and a suggested once-a-week cap are proposals
to agree with Sonia. Anonymous visits or logging in alone do not trigger email.
AskHaus contributes only preferences the person confirms for this purpose.

Also needed: enquiry receipts followed by staff replies, approved newsletters,
working unsubscribe/preferences links, provider opt-out synchronisation,
delivery monitoring, suppression and a test with actual staff inboxes.

Existing code saves enquiries and queues staff notifications through either
Power Automate or ZeptoMail. Power Automate is the Excel route; ZeptoMail does
not also write Excel. Resend code handles account/careers emails. These are
foundations, not proof of a working live setup. The personalised interest store,
customer scheduler and campaign sending are still unbuilt. Mailchimp is an
option to discuss, not an account already selected or connected. Zoho Mail
staff inboxes and ZeptoMail transactional delivery are different services.

GTM/GA4 measures consented site usage separately. It is not the website's
customer-interest database and cannot be used as an anonymous visitor-to-email
lookup. Request the company GTM/GA4 IDs and access, plus Search Console access;
Google Cloud credentials are not the requested input.

## Next finish line

Update, 17 September: Desire directed Surya to **Fatima** to identify the
designers responsible for the outstanding blog covers. Do not assign those
images to Adifah or assume Fatima created them. Surya also asked for an
immediate reminder to discuss the email setup with Sonia; the reminder was
given in the conversation, and no message was sent to Sonia.

Agree the existing company email accounts and owners, a monitored team inbox,
whether Excel is still required, and access to an isolated hosted test site and
database. Surya does not want a local backend. A Vercel link could demonstrate
the site, but does not itself configure the database, email or worker. Hosting
and provider choices still need agreement before provisioning.

First prove one hosted enquiry is saved, reaches the team and agreed Excel
destination, sends a customer receipt and can be replied to. Then demonstrate
one newsletter and one personalised follow-up with test addresses, including
unsubscribe/cancellation. Production release remains separate.

## 17 September: enquiry page and navigation

- Built `/enquire` (“Have a query?”) on Release 2 for a future social-media
  link. General/service, buying, renting, investing and selling/letting questions
  share the existing `/api/leads` intake, saved consent and delivery outbox.
  No new database migration or email provider is required for this page.
- Questions, first name, email and privacy acknowledgement are required;
  telephone and marketing opt-ins are optional. Country/city fields appear for
  property topics. Questions and contact details are excluded from analytics.
  Failed requests retain answers; success means the enquiry was saved, not that
  a team/customer email was delivered. Intake feature flag also gates this page,
  its footer link and sitemap entry.
- Removed “Browse by type” and the Residential/Commercial descriptions from
  both Properties menus. Property-type filters in the catalogue remain available.
- Surya confirmed Al Furjan and Azizi Monaco Mansions. Corrected their native
  Sanity drafts to Off-plan / sale, including completed-availability wording.
  Verified published records and unrelated fields unchanged. Local before/after
  backup is under `.git/off-plan-corrections-2026-09-17/`. Florence stays paused.
- Local demo: `http://127.0.0.1:3217/`, enquiry page at `/enquire`. This frontend
  preview uses an unreachable database target and disabled delivery; it cannot
  prove hosted persistence, actual email or Excel receipt. No local database runs.
- Verification: 68 targeted backend tests and six SEO/analytics checks passed;
  TypeScript, focused ESLint and the production webpack build passed. Browser
  checks covered desktop/mobile menus, required fields, optional topic fields,
  clearing hidden property preferences and preserving answers on a real failed
  local API request. Mocked persistence/outbox tests do not prove hosted delivery.
  Sanity draft read-back verified the exact two records; no schema was changed.

## Supporting records

Further SEO work stays in Release 2 while Deb reviews Release 1. The seller
page now has page-specific metadata and a self-referencing `/list-property`
canonical. Sitemap modification dates come from Sanity `_updatedAt`; unknown
dates are omitted rather than replaced with the generation time. These are
technical corrections, not evidence of ranking gains or a completed SEO audit.
Four sitemap regression tests, focused ESLint, production compilation and its
TypeScript check passed. Built seller-page HTML confirms the canonical and OG
URL resolve to `https://hausofestate.com/list-property`. The newsletter preview
was walked through to its final consent step without submission; its readiness
message is visible and marketing remains unchecked. Existing E2E assertions were
updated for the new labels but that mocked browser suite was not rerun. Local
preview now serves the production build at port 3217; database/email remain
unavailable/disabled. No live signup, campaign, deployment or publication occurred.

- [Artwork review](../artifacts/blog-cover-review-2026-09-16.html) — four matched images and exact outstanding list.
- [SEO verification](seo-verification-2026-09-16.md) — original audit mapped to actual changes and remaining evidence.
- [Email scenarios and copy/paste Sonia message](email-scenarios-handoff-2026-09-16.md).
- [Email backlog reconciliation](email-backlog-reconciliation-2026-09-16.md) — all H01–H16 requests, existing implementation and missing owners/inputs.

Do not treat this supporting backlog as permission to start every task at once.
Sonia should choose the next business priority; access/content decisions stay
with their owners rather than being counted as unfinished development.
