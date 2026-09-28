# Zoho email and confirmed booking setup

The website has a backend for enquiries, but this machine is not connected to
the production database or mail provider. Setting up a Zoho Mail inbox alone
does not connect a website form, provide a database, or reserve calendar slots.

## Enquiry delivery already available in Release 2

`POST /api/leads` validates requests and persists each accepted lead and its
immutable delivery event in one PostgreSQL transaction. Retries share the same
submission ID; database leases keep the web attempt and five-minute worker from
processing an event concurrently. Database failure is not reported as a saved
enquiry. The enquiry's contact message is now included in the existing delivery
`row.notes` field as well as `Lead.message`; the version 3.0 wire format and Excel
headings remain compatible. Existing immutable queued events are not rewritten.
Contact details and messages remain in this operational pipeline, not analytics.

Two mutually exclusive delivery providers are available:

| Setting | What happens after the database commit |
| --- | --- |
| `LEAD_DELIVERY_PROVIDER=powerautomate` (default) | The configured flow updates the team's Excel view and acknowledges its operational notification. Follow [the rollout guide](lead-delivery-rollout.md). |
| `LEAD_DELIVERY_PROVIDER=zeptomail` | ZeptoMail accepts a plain-text enquiry notification for the configured Haus mailbox. This route does not update Excel. |

Both use the existing outbox worker, retries, backoff and dead-letter handling.
`LEAD_DELIVERY_ENABLED` stays disabled unless explicitly enabled. The ZeptoMail
adapter performs no sends when disabled, rejects missing or invalid settings,
and never falls back silently to another provider or mailbox.

## Zoho Mail and ZeptoMail serve different purposes

Zoho Mail can host the team's `@hausofestate.com` inboxes. Its SMTP settings and
credentials depend on the account and region; authenticated sending must use a
matching sender or alias. The existing inbox can receive website notifications
without moving the website database or changing the site's current email
provider. See [Zoho Mail SMTP configuration](https://www.zoho.com/mail/help/zoho-smtp.html).

For website-triggered enquiry notifications, the optional integration uses
ZeptoMail's transactional email API. It requires an Agent's Send API key and a
verified sender domain. API acceptance is checked using a success code and
request ID; it is not proof of inbox delivery. Tracking is disabled; the team
mailbox receives the message and the customer's address supplies Reply-To. ZeptoMail does not support
newsletter or promotional campaigns; consented marketing needs a separate
campaign service. See [ZeptoMail's email API](https://www.zoho.com/zeptomail/help/api/email-sending.html).

Authentication verification/reset emails and careers applications still use
the existing **Resend** integration. This change does not migrate them to Zoho.
The older legacy-lead fallback also remains Resend; use the outbox provider for
durable enquiry notifications. Its historical mock-success fallback is not
evidence that a legacy notification was delivered.

## Connect the operational mailbox

Before enabling ZeptoMail, Haus needs to confirm the monitored recipient inbox,
sender, account region and owner. `info@hausofestate.com` is the public address
in Contact/Snagging and the documented Power Automate destination. There is no
verified marketing-specific address in the source. `ADMIN_EMAIL` and
`CAREERS_EMAIL` concern the separate Resend path; they do not route ZeptoMail.

Configure these **server-only** variables in both web and worker services:

```dotenv
LEAD_DELIVERY_PROVIDER="zeptomail"
LEAD_DELIVERY_ENABLED="false"
ZEPTOMAIL_API_URL=""
ZEPTOMAIL_SEND_MAIL_TOKEN=""
ZEPTOMAIL_FROM_EMAIL=""
LEAD_NOTIFICATION_TO="info@hausofestate.com"
```

Copy the full send URL from the account's SMTP/API tab. Supported URLs are
`https://api.zeptomail.com/v1.1/email`,
`https://api.zeptomail.eu/v1.1/email`, and
`https://api.zeptomail.in/v1.1/email`. There is no default region. Other endpoints
require verification before expanding the allowlist. Redirects, custom hosts,
alternate paths, ports, credentials, query strings and fragments are rejected.
Use the bare Send API key, not a Zoho Mail password or OAuth login URL.

Set one explicit `@hausofestate.com` sender and recipient. The provider must
verify the chosen sender domain; its DNS instructions require the account's
DKIM and return-path CNAME records. No DNS/MX record is changed by this code.
See [ZeptoMail domain verification](https://www.zoho.com/zeptomail/help/domains.html).

Connect the database and reviewed migrations, configure these values with
delivery disabled, then use a controlled test after the team has approved the
real mailbox. Confirm one lead, one outbox event, provider acceptance and actual
inbox receipt. Test failure/retry and reply handling before enabling production.
No live messages were sent during implementation.

The worker marks an event `DELIVERED` when the provider accepts the request;
monitor the provider's delivery/bounce logs separately. ZeptoMail's
`client_reference` tracks the event but is not documented as a deduplication
guarantee. A lost response or crash after provider acceptance can cause a retry
and a duplicate team email. Include the event/lead ID when reconciling such
cases. Before switching providers, pause both web and worker delivery, reconcile
in-flight/ambiguous events, and update both services together. Pending events
use the configured provider when processed; their payload does not pin a provider.

## Confirmed inspection bookings

The team calendar has not been set up yet. Use the official service-specific
Zoho Bookings page/widget after connecting the team calendar. Zoho Bookings can
check calendars for conflicts and add confirmed appointments to a selected
calendar. Its own booking result should be the source of confirmation; a
calendar icon, enquiry submission, iframe load or link click confirms nothing.
See [calendar connections](https://help.zoho.com/portal/en/kb/bookings-2-0/integrations/calendars/articles/connect-your-calendars)
and [official booking widgets](https://www.zoho.com/bookings/features/integrations/booking-widgets.html).

Haus needs the calendar owner, inspection duration, working hours, location/time
zone, travel buffers, cancellation/rescheduling rules and monitored notification
recipient. Enable staff notifications in Bookings and test a booking, conflict,
reschedule and cancellation against the actual team calendar. Configure the
website with its public booking page and official iframe source; keep
`SNAGGING_BOOKING_ENABLED=false` until the calendar is connected and tested.
API/admin/OAuth URLs and secrets do not belong in those public URL settings.

This embed does not write appointments into the app's Lead table. A future
provider webhook integration would need verification and idempotency before
mirroring confirmed/cancelled events into the enquiry pipeline.

## Google Analytics is already placed through GTM

The site's consent manager loads GTM into `document.head` after analytics consent,
on permitted public pages and production hosts. A second unconditional Google
Analytics snippet would bypass that control and can duplicate page views.
The company GTM container ID is still required in `NEXT_PUBLIC_GTM_ID`, with
the GA4 stream configured inside that container. Follow [Release 1 analytics](release-1-analytics.md)
and verify real Tag Assistant/GA4 receipt after access is available. Do not send
contact messages, email addresses or booking details as analytics parameters.
Google requires default consent before measurement and updates when consent
changes: [Google consent setup](https://developers.google.com/tag-platform/security/guides/consent).

## Local verification and outstanding access

At the 14 September 2026 audit, `DATABASE_URL`, `RESEND_API_KEY`, the company GTM
ID and all Power Automate credentials were absent/empty in the local environment.
No ZeptoMail or booking credentials were configured. This is a local observation,
not a claim about production services. Auth secrets and lead feature-setting
names were present; secret values were not displayed.

Tests exercise only mocked HTTP responses and database repositories. They cover
fixed team routing, explicit provider selection, missing settings, endpoint and
mailbox restrictions, private text messages, disabled tracking, valid provider
acceptance, invalid/empty replies, HTTP failures, timeouts, retries and legacy
payload compatibility. They do not establish a connected mailbox/calendar or
successful production collection in GA4.
