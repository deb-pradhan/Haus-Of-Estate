# Haus of Estate implementation handoff

Updated: 2 September 2026

## Repository and branch safety

- Repository: `deb-pradhan/Haus-Of-Estate`
- Developer: Surya (`suryak02`)
- Never push or merge directly to `main`.
- Existing foundation branch: `suryak02/lead-intake-foundation`
- Foundation draft PR: `#1`
- Current stacked branch: `suryak02/lead-intake-qualifiers`
- The qualifier PR should target `suryak02/lead-intake-foundation` until that
  dependency merges, then be rebased and retargeted to `main`.
- Current contact-first branch: `suryak02/lead-intake-contact-first`
- The contact-first PR should target `suryak02/lead-intake-qualifiers` until
  that dependency merges, then be rebased and retargeted in sequence.

## Qualifier milestone implemented

The shared three-step enquiry form treats the requested first response or
shortlist as fulfilment of the enquiry. It presents two independent, unchecked
email choices:

1. Recurring property and opportunity emails matching the submitted brief.
2. The general Haus of Estate newsletter.

Newsletter-only registration is rejected unless the newsletter choice is
affirmatively selected. Buyer, renter, and investor flows use `Send my brief`;
no automated match is promised. The confirmation screen explains exactly which
choices were made and links to Haus accounts on Instagram, LinkedIn, Facebook,
Pinterest, YouTube, and X.

The final Preferences step also shows the same six social links before
submission and an optional `I am a cash buyer purchasing from overseas`
qualifier for buyer and investor briefs. This is stored as adviser context, not
marketing consent, and is unchecked by default.

The API contract carries `propertyMatchOptIn`, `newsletterOptIn`, and
`overseasCashBuyer`. PostgreSQL stores one immutable
Lead snapshot per enquiry, a current match-subscription state, and append-only
match consent/withdrawal evidence containing the exact wording, form/privacy
versions, source, campaign, and page context. Match and newsletter state are
committed with the lead and outbox in one serializable transaction.

The Excel/Power Automate contract is version `3.0` and carries separate
`property match opt-in`, `newsletter opt-in`, and `overseas cash buyer`
columns. Pending immutable v1/v2 outbox events are upgraded safely with missing
values set to false. Delivery remains disabled by default.

The privacy page distinguishes one-off enquiry handling, overseas purchase
context, recurring match emails, and newsletters. Launch is still blocked
because the company number, registered address, and privacy-controller details
are not confirmed.

## Contact-first and privacy milestone implemented

The shared popup and `/register-interest` form now follow this journey:

1. Contact: first name and email, plus optional phone and message.
2. Interest: buy, rent, invest, sell/let, or newsletter only.
3. Preferences: country of interest, city/area/community, property details,
   timeframe, adviser context, and any optional email choices.

The former user-facing `Market` field is labelled `Country of interest` and
contains country values. `City, area or community` remains a separate text
field. For backward compatibility with the existing database and the approved
Power Automate contract, the selected country continues to travel internally
as `preferences.market` and the Excel heading remains `market` until Marketing
approves a coordinated workbook/flow change.

The Contact step includes a required, unchecked acknowledgement that the user
has read the Privacy Policy and understands how Haus will use their details to
respond. It is deliberately described and recorded as a transparency
acknowledgement, not as the lawful basis for handling the enquiry and not as
marketing consent. Recurring property-match emails and the newsletter remain
separate, optional, unchecked choices on the final step. The selected country
describes the property sought; it must not be treated as the user's residence,
nationality, or a signal of which privacy regime applies.

The form/privacy pair is versioned as `2026-09-01.v4` /
`2026-09-01.v2`, and the exact notice snapshot is archived at
`docs/legal/lead-notice-2026-09-01-v2.md`. Identical retries from prior form
versions remain idempotent, while a new submission from an expired modern form
is asked to refresh. No database migration was needed for this milestone.

The Ras al Khaimah PDF has not been added because the approved asset is still
pending. When supplied, the safer first release is a one-off `Email me the
guide` request with its own delivery wording, alongside a separate optional
newsletter checkbox. Receiving the guide must not silently subscribe someone
to recurring marketing.

## Homepage country-filter correction

The homepage hero previously had a separate hard-coded `Location` selector
containing cities, even though the shared EOI form had already moved to country
selection. Draft PR `#11` fixes that independently on
`suryak02/homepage-country-filter`:

- The compact search control now reads `Country` and defaults to `Any country`.
- It offers United Kingdom, United Arab Emirates, Indonesia, and Cyprus.
- Canonical country names continue through the existing `location` query key,
  which already searches the Sanity `country` field as well as legacy city and
  community links.
- Analytics now includes `selected_country` while temporarily retaining
  `selected_location` for Tanu's existing GTM mapping.

City, area, or community remains available in the fuller lead-enquiry journey;
the compact homepage control intentionally starts at country level.

## Verification completed

- Prisma schema validation and client generation pass.
- TypeScript passes.
- 78 Vitest tests pass.
- 12 Playwright desktop/mobile lead-intake tests pass, including a 320px
  overflow check.
- The contact-first browser suite also covers required privacy acknowledgement,
  the country/city split, old-version replay safety, and UAE adviser routing.
- The combined product preview passes 248 Vitest tests, TypeScript, and a
  production build after the homepage country-filter merge.
- ESLint passes for all files changed in this milestone.
- The repository-wide lint command still fails on pre-existing unrelated files;
  do not attribute those baseline errors to this branch.

## External dependencies before enablement

- Sonia/legal approval of exact form and privacy wording.
- Tanu approval of the existing non-PII conversion-event mapping.
- Confirmed legal/controller details for the privacy policy.
- Restricted Excel workbook and approved qualifier/consent columns.
- Updated authenticated Power Automate flow and staging end-to-end test.
- Railway backup, live-schema comparison, migration approval, and secrets.

## Next independent branches

1. `suryak02/content-sharing` from current `origin/main`.
2. `suryak02/purchase-readiness-prototype` stacked on the lead foundation.
3. Sanity editorial workflow, then auth hardening and saved content.
4. AI property assistant only after those platform foundations and reviews.
