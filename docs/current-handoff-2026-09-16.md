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

## Supporting records

- [Artwork review](../artifacts/blog-cover-review-2026-09-16.html) — four matched images and exact outstanding list.
- [SEO verification](seo-verification-2026-09-16.md) — original audit mapped to actual changes and remaining evidence.
- [Email scenarios and copy/paste Sonia message](email-scenarios-handoff-2026-09-16.md).
- [Email backlog reconciliation](email-backlog-reconciliation-2026-09-16.md) — all H01–H16 requests, existing implementation and missing owners/inputs.

Do not treat this supporting backlog as permission to start every task at once.
Sonia should choose the next business priority; access/content decisions stay
with their owners rather than being counted as unfinished development.
