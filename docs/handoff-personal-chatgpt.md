# Haus of Estate implementation handoff

Updated: 7 September 2026

## Blog share rail clearance

Draft PR #3 now places the desktop article share rail 128px from the viewport
top, leaving 27px below the 101px header. The change is included in the local
integration preview. Browser checks passed at 1280px and 1435px, including the
Properties menu; the mobile sharing fallback also fits and opens at 390px.
Targeted lint passed. Hreflang remains deferred pending equivalent localized URLs.

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

## Dynamic country and city search

Sonia's latest requirement is a dependent `Country -> City` property search,
not another hard-coded country list. Draft PR `#11` now implements this on
`suryak02/homepage-country-filter`:

- A read-only same-origin endpoint derives distinct country/city pairs from
  currently published, discoverable Sanity properties.
- Selecting a country constrains the city selector; changing country clears a
  stale city selection.
- `/properties` carries exact `country` and `city` query parameters and exposes
  removable filter chips. Legacy broad `location` links remain compatible.
- Public discovery excludes sold, rented and withdrawn records when the new
  lifecycle field is present. Older records with no lifecycle value are treated
  as active until the approved taxonomy backfill runs.
- Older records missing category, availability or listing intent retain narrow
  residential/ready/sale compatibility defaults instead of disappearing from
  the current homepage journey.
- Analytics now adds `selected_country` and `selected_city` while temporarily
  retaining `selected_location` for Tanu's existing mapping.

The current published inventory truthfully produces only `United Arab Emirates
-> Dubai`. Sharjah will appear automatically after an eligible Sharjah record is
completed and published; no speculative cities are shown.

## Azizi Florence staging scaffold

Draft PR `#12` on `suryak02/azizi-florence-content-scaffold` targets editorial
workflow PR `#5`. It contains one importable, staging-only draft at
`scripts/azizi-florence.staging-draft.ndjson` with only these confirmed facts:

- Azizi Florence, slug `azizi-florence`.
- Community/development `Florence`.
- Sharjah, United Arab Emirates.
- Developer `Azizi Developments`.
- Native draft ID, workflow status `draft`, and `featured: false`.

No dataset has been mutated. The scaffold deliberately omits price, currency,
sizes, unit mix, category, property type, sale/rent intent, ready/off-plan state,
completion, payment plan, availability, verification, copy, media, publication
date and approvals. No QR code is present. It must not be imported into
production or published until Sonia supplies the missing facts/assets and the
PR #5 editorial gates are satisfied.

## AI sales agent scope

Do not build a second chatbot. The future sales journey should compose PR #8's
guarded Haus Property Assistant with the existing `LeadEoiForm`, lead API,
PostgreSQL consent records, UTM attribution and Power Automate outbox.

The smallest future MVP is an editable qualification brief, approved inventory
search, up to three real property cards, and an explicit handoff into the
existing lead form. The model must never submit a lead, store/transmit the raw
conversation, initiate payments or make eligibility, legal, tax, mortgage or
investment decisions. Before that work starts, Sonia must approve the login
gate, qualification fields/order, allowed listing states, placement, handoff
owner/SLA and customer copy.

## Meta, GTM and hreflang

The application already has a GTM loader, attribution capture and PII-free lead
and assistant data-layer events. Haus has not yet supplied company-owned GTM,
GA4 or Meta dataset access. A real consent-management layer must be implemented
before Meta/GA4 tags: default-denied Analytics and Marketing categories,
withdrawal/settings controls, and truthful cookie/privacy wording. Only a
persisted `lead_submit_success` should map to Meta `Lead`; property search is a
search event, not a lead. Names, email addresses, phone numbers, messages, raw
prompts and full referrers must never enter analytics events.

Hreflang is not currently appropriate. Haus has one English URL set and no
equivalent localized routes, translations or reciprocal alternate mappings.
Selling properties in multiple countries is inventory targeting, not page
localization. Revisit only after real paired locale URLs and content exist.

## Verification completed

- Prisma schema validation and client generation pass.
- TypeScript passes.
- 78 Vitest tests pass.
- 45 Playwright desktop/mobile integration tests pass, including lead intake,
  content sharing, authentication, bot protection, saved content, editorial
  workflow, purchase readiness and the assistant.
- The contact-first browser suite also covers required privacy acknowledgement,
  the country/city split, old-version replay safety, and UAE adviser routing.
- The combined product preview passes 248 Vitest tests, TypeScript, Sanity
  schema validation and a production build after the country/city merge.
- PR #11's API returns the live `United Arab Emirates -> Dubai` hierarchy. The
  desktop journey returns both published Dubai listings with exact URL filters,
  and the responsive form was verified at 390x844.
- The Florence NDJSON parses as one document with exactly ten approved fields;
  no Sanity write was performed.
- ESLint passes for all files changed in this milestone.
- The repository-wide lint command still fails on pre-existing unrelated files;
  do not attribute those baseline errors to this branch.
- Local Sanity Live preview still needs the exact `127.0.0.1:3210` CORS origin,
  and two existing homepage images emit missing `sizes` warnings.

## External dependencies before enablement

- Sonia/legal approval of exact form and privacy wording.
- Sonia's Florence pricing, currency, sizes, unit mix, availability, factual
  copy and approved image assets.
- Tanu approval of the existing non-PII conversion-event mapping.
- Tanu/Haus-owned GTM, GA4 and Meta dataset IDs, domain/ad-account ownership,
  staging access, UTM convention and test-event sign-off.
- Confirmed legal/controller details for the privacy policy.
- Approved CMP behavior and corrected cookie/privacy disclosures before any
  advertising or analytics tags are enabled.
- Restricted Excel workbook and approved qualifier/consent columns.
- Updated authenticated Power Automate flow and staging end-to-end test.
- Railway backup, live-schema comparison, migration approval, and secrets.
- Sanity staging dataset, exact CORS origins, preview tokens, content roles and
  the property taxonomy/availability backfill.
- Deb's approval of any AI sales-agent branch, AI Gateway ownership/model/budget
  controls, DPIA/vendor review and production release process.

## Next independent branches

1. Review/merge dynamic search PR `#11`; keep it independent from lead work.
2. Complete Florence facts/assets in staging through PR `#12` after PR `#5` is
   available and Sonia responds. Do not publish the current scaffold.
3. Create a separate consent/paid-tracking branch before enabling GA4 or Meta.
4. Scope `suryak02/ai-sales-agent-mvp` only after country/city, lead intake,
   editorial workflow and Property Assistant PR `#8` are reconciled.
5. Keep Latest News, PDF newsletters and the exact LinkedIn workflow as later
   work until Marketing defines what “LinkedIn integration” means.
