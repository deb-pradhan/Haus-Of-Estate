# Haus of Estate implementation handoff

Updated: 1 September 2026

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

The contact step also shows the same six social links before submission and an
optional `I am a cash buyer purchasing from overseas` qualifier for buyer and
investor briefs. This is stored as adviser context, not marketing consent, and
is unchecked by default.

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

## Verification completed

- Prisma schema validation and client generation pass.
- TypeScript passes.
- 78 Vitest tests pass.
- 12 Playwright desktop/mobile lead-intake tests pass, including a 320px
  overflow check.
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
