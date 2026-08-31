# Haus of Estate implementation handoff

Updated: 31 August 2026

## Repository and branch safety

- Repository: `deb-pradhan/Haus-Of-Estate`
- Developer: Surya (`suryak02`)
- Never push or merge directly to `main`.
- Existing foundation branch: `suryak02/lead-intake-foundation`
- Foundation draft PR: `#1`
- Current stacked branch: `suryak02/lead-intake-qualifiers`
- The qualifier PR should target `suryak02/lead-intake-foundation` until that
  dependency merges, then be rebased and retargeted to `main`.

## Qualifier milestone implemented

The shared three-step enquiry form now treats the requested first response or
shortlist as fulfilment of the enquiry. It adds two independent, unchecked
marketing choices:

1. Recurring property and opportunity emails matching the submitted brief.
2. The general Haus of Estate newsletter.

Newsletter-only registration is rejected unless the newsletter choice is
affirmatively selected. Buyer, renter, and investor flows use `Send my brief`;
no automated match is promised. The confirmation screen explains exactly which
choices were made and links to Haus accounts on Instagram, LinkedIn, Facebook,
Pinterest, YouTube, and X.

The API contract carries `propertyMatchOptIn`. PostgreSQL stores one immutable
Lead snapshot per enquiry, a current match-subscription state, and append-only
match consent/withdrawal evidence containing the exact wording, form/privacy
versions, source, campaign, and page context. Match and newsletter state are
committed with the lead and outbox in one serializable transaction.

The Excel/Power Automate contract is version `2.0` and adds `property match
opt-in` immediately before `newsletter opt-in`. Pending immutable v1 outbox
events are upgraded safely with match consent set to false. Delivery remains
disabled by default.

The privacy page now distinguishes one-off enquiry handling, recurring match
emails, and newsletters. Launch is still blocked because the company number,
registered address, and privacy-controller details are not confirmed.

## Verification completed

- Prisma schema validation and client generation pass.
- TypeScript passes.
- 69 Vitest tests pass.
- 11 Playwright desktop/mobile lead-intake tests pass.
- ESLint passes for all files changed in this milestone.
- The repository-wide lint command still fails on pre-existing unrelated files;
  do not attribute those baseline errors to this branch.

## External dependencies before enablement

- Sonia/legal approval of exact form and privacy wording.
- Tanu approval of the existing non-PII conversion-event mapping.
- Confirmed legal/controller details for the privacy policy.
- Restricted Excel workbook and approved `property match opt-in` column.
- Updated authenticated Power Automate flow and staging end-to-end test.
- Railway backup, live-schema comparison, migration approval, and secrets.

## Next independent branches

1. `suryak02/content-sharing` from current `origin/main`.
2. `suryak02/purchase-readiness-prototype` stacked on the lead foundation.
3. Sanity editorial workflow, then auth hardening and saved content.
4. AI property assistant only after those platform foundations and reviews.
