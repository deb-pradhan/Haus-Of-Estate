# Sonia demo feedback — 14 September 2026

Continue this work on `suryak02/azizi-florence-content-scaffold` (Release 2).

## Article artwork

Desire, Adifah and Likith are the people Surya identified for replacement article
images. Their email addresses/contact channels have not been provided. No message
has been sent on Surya's behalf.

Brief to send:

> Please supply replacement website article covers in landscape 16:9, ideally
> 1920 × 1080 px. Artwork should fill the canvas edge to edge, with no white
> borders or padding. Keep important text and logos readable within the frame.

## Snagging education and international search

Link Fatima Rangwala's existing published article, “Snag It Before You Sign It —
The UAE Buyer's Guide to Snagging”, from the service page. Explain the service
with ordinary terms such as new-build inspection, defect checks and pre-handover
inspection, alongside the word snagging. Include answered FAQs about timing,
inspection scope, reporting, quotes and booking.

Country-specific pages should follow verified service coverage and genuinely
useful local content. Don't create near-identical country pages or imply that
UAE legal processes apply in other countries. Add reciprocal `hreflang` only
when actual language/region versions exist; the current page remains canonical
at `/snagging`.

Source: [Google international-site guidance](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

## Confirmed inspection appointments

Surya chose **confirmed bookings from the team's real calendar**, rather than
preferred dates awaiting confirmation. He confirmed that the calendar **is not
set up yet**. No available slots, reserved appointments, scarcity counts or
confirmation emails have been invented.

The website integration accepts the public booking URL and optional iframe URL
from the chosen provider. It loads the external calendar only when the visitor
opens it, and retains a direct booking link. While disabled, visitors can contact
the team for a quote and arrangements.

Zoho Bookings is a suitable option to assess alongside Deb's Zoho Mail suggestion.
It supports service booking pages, embedded calendars and customer confirmations.
Zoho Mail is the mailbox service; it does not itself configure this service's
staff availability or inspection rules.

Company setup required:

1. Assign the company account owner and staff/inspection calendars. Confirm
   location coverage, time zones and which busy calendars block appointments.
2. Define services and their durations by property type/size, operating hours,
   travel buffers, notice periods and cancellation/rescheduling rules. Confirm
   whether a quote/payment is needed before an inspection can be booked.
3. Configure the required property/address/contact fields and confirmed-booking
   notifications to both customer and the designated Haus mailbox. Verify the
   exact recipient; `info@hausofestate.com` is the published general address,
   while a marketing-specific recipient has not been confirmed.
4. Copy the provider's **public service booking page** and optional iframe `src`
   into `SNAGGING_BOOKING_URL` and `SNAGGING_BOOKING_EMBED_URL`. Never put API
   credentials or an admin/calendar management URL into these fields.
5. Test a designated team appointment: concurrent attempts at the same slot,
   staff busy time, UK/UAE time zones, correct service duration, both received
   emails, rescheduling and cancellation. Test bookings require separate
   authorization because they reserve real staff time and send notifications.
6. Set `SNAGGING_BOOKING_ENABLED=true` only after those checks. A development
   server restart/production rebuild may be needed for changed configuration.

Sources: [Zoho Bookings](https://www.zoho.com/bookings/),
[embedding a booking calendar](https://help.zoho.com/portal/en/kb/bookings/my-profile/articles/embed-as-widget-15-12-2022).

## Backend and email

The app already has PostgreSQL/Prisma models, consent capture and a durable
staff-enquiry outbox. Local database credentials are absent, so real persistence
is not available yet. Missing database configuration now produces an unavailable
response from the enquiry API rather than an unexplained server error.

An optional ZeptoMail transport prepares Zoho transactional staff notifications
without changing the existing Power Automate default. The provider token,
verified sender, regional endpoint and exact staff recipient still need company
setup. Account verification/reset email remains on the existing Resend adapter.
See `docs/zoho-lead-delivery.md` for the resulting implementation and checks.
Neither email infrastructure nor the customer database is replaced by Sanity.
Personalised marketing follow-ups retain their separate consent/scope milestone.

## Currency display

The header now offers Original currency, AED, GBP and USD. The default preserves
each listing's own currency; a visitor's explicit choice is remembered locally.
The same price component is used on listing/detail/showcase/saved surfaces and
Florence previews. The CBUAE's official dirham artwork replaces the visual AED
label before property amounts; Sanity fields and structured data keep ISO codes.
The source artwork and attribution are in `public/currency/`.

Conversions use Frankfurter's daily indicative rates through the website's
server endpoint, with the source date shown. This is not a continuously traded
rate or an exchange/payment quote. The original listing price stays visible.
Missing, invalid, future or expired rates preserve the original amount.

Structured numeric prices take priority. A strict legacy parser also accepts a
complete, single price with an explicit supported currency and optional “From”
or rental period. It rejects ranges, ambiguous dollar signs and other prose.
When the numeric value accompanies a broader price range, the converted amount
is labelled a reference price and the complete original range is retained.

The public read returned two listings: Al Furjan is price on application, while
Monaco's “From AED 50,039,000” qualifies for exact legacy parsing. Five Florence
home-type entries contain numeric AED amounts; the overview has no single price.
Those Florence records remain drafts, with the local review bundle available at
`/dev/property-previews`. No price records were backfilled or published.

Sources: [CBUAE currency and official symbol](https://centralbank.ae/en/our-operations/currency-and-coins/),
[Frankfurter rate API](https://frankfurter.dev/).

## Verification

- 346 Vitest tests across 50 files passed, including currency parsing/rates,
  booking configuration, email transport and missing-database handling.
- Six SEO/analytics runtime checks passed; the production build and its
  TypeScript checks passed. Sanity schema: zero errors, zero warnings.
- Desktop/mobile snagging checks passed: real Fatima article navigation,
  keyboard FAQ expansion, canonical URL and unavailable-calendar state with
  no iframe. A transient mobile parse error did not recur on the clean retry.
- The actual local exchange-rate endpoint returned HTTP 200 with rates dated
  14 September 2026. A local enquiry with the database absent returned HTTP 503
  and did not claim it was saved.
- Email acceptance/retry tests use a mocked provider. Company calendar booking,
  database persistence, real inbox receipt and GA4 collection remain unverified.

## Analytics follow-up

The existing consent-controlled Google Tag Manager loader already appends its
script to `document.head`. Add the company GTM container ID, configure GA4 inside
that container and verify actual receipt in GA4 DebugView/Realtime. Do not add a
second analytics snippet. See `docs/release-1-analytics.md`.

A one-time app reminder was created for 15 September 2026 at 10:00 Europe/London:
`connect-haus-google-analytics`. It includes the three article-image contacts.
No analytics account, tag, production deployment or outbound email was changed.
