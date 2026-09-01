# Haus of Estate product-upgrade handoff

Paste this document into Surya's separate ChatGPT account when continuing the
Haus of Estate work.

## Working agreement

- Repository: `deb-pradhan/Haus-Of-Estate`
- Developer: Surya (`suryak02`)
- Never push or merge directly to `main`.
- Every capability has its own `suryak02/*` branch and draft pull request.
- Keep incomplete or externally blocked capabilities disabled by default.
- Squash-merge each approved feature so it retains one clean revert point.
- The production host, Railway database, Sanity organisation, social accounts,
  Power Automate flow, Excel workbook, and AI Gateway remain company-owned
  external dependencies.

## Draft pull requests

1. [PR #1: phase-one lead intake foundation](https://github.com/deb-pradhan/Haus-Of-Estate/pull/1)
   is `suryak02/lead-intake-foundation` into `main`.
2. [PR #2: independent lead qualifiers](https://github.com/deb-pradhan/Haus-Of-Estate/pull/2)
   is `suryak02/lead-intake-qualifiers` into PR #1's branch.
3. [PR #3: canonical content sharing](https://github.com/deb-pradhan/Haus-Of-Estate/pull/3)
   is `suryak02/content-sharing` into `main`.
4. [PR #4: protected-payment guide](https://github.com/deb-pradhan/Haus-Of-Estate/pull/4)
   is `suryak02/purchase-readiness-prototype` into PR #1's branch.
5. [PR #5: Sanity editorial workflow](https://github.com/deb-pradhan/Haus-Of-Estate/pull/5)
   is `suryak02/sanity-editorial-workflow` into `main`.
6. [PR #6: authentication hardening](https://github.com/deb-pradhan/Haus-Of-Estate/pull/6)
   is `suryak02/auth-hardening` into `main`.
7. [PR #7: saved properties and articles](https://github.com/deb-pradhan/Haus-Of-Estate/pull/7)
   is `suryak02/saved-content` into PR #6's branch.
8. [PR #8: Haus Property Assistant](https://github.com/deb-pradhan/Haus-Of-Estate/pull/8)
   is `suryak02/property-assistant` into PR #7's branch.

All eight PRs are drafts. None has been merged into `main` or deployed to
production.

## What is implemented

### Lead intake

PR #1 provides the shared three-step `LeadEoiForm`, lazy popup, dedicated
`/register-interest` page, strict API contract, append-only lead and consent
data, idempotency, throttling, attribution, an outbox worker, Power Automate
delivery contract, tracked social links, and PII-free analytics. PostgreSQL is
authoritative; Excel is only Marketing's operational view.

PR #2 separates shortlist fulfilment, recurring property-match consent, and
newsletter consent. It adds append-only match-subscription/consent history,
withdrawal support, revised wording/versioning, social success links, and the
versioned Excel match-alert field. Cash-buyer and funding questions remain
deliberately deferred.

### Sharing and purchase readiness

PR #3 generalises canonical sharing for property and article pages. It prefers
the native share sheet and falls back to Copy Link, WhatsApp, email, Facebook,
LinkedIn, X, and Pinterest. It removes query strings/fragments, includes an
accessible article rail and property share action, and does not yet create
branded short URLs.

PR #4 adds only a disabled educational property-page guide explaining protected
payment steps and ending in the existing property-context enquiry. It collects
no payment, bank, identity, passport, or source-of-funds data and creates no
payment API or transaction model. Haus must never hold or forward client money.

### Sanity, authentication, and saved content

PR #5 keeps `/studio` as the staff dashboard and adds staging/preview,
revalidation, publication-state checks, property taxonomy/verification fields,
and a human-approved `socialCampaign` publishing pack. Sanity remains canonical;
automatic LinkedIn/Meta publishing stays off until Haus owns approved apps and
permissions.

PR #6 hardens password and Google authentication, verification, reset tokens,
protected return paths, rate limits, session invalidation, and migration
approval. Registration no longer creates a lead or assumes marketing consent.

PR #7 adds anonymous local saves, idempotent merge after login, authenticated
`GET`/`PUT`/`DELETE /api/saved`, property hearts, article bookmarks, and a
two-tab `/saved` page. It stores immutable Sanity IDs only and filters out
unpublished/archived content instead of copying the dormant Prisma property
catalogue.

### Haus Property Assistant

PR #8 adds a disabled, authenticated AI discovery assistant with a lazy
launcher, natural-language property entry, accessible mobile sheet, current
property cards, approved source links, ordinary filters, and an editable human
handoff. A guest can draft a question, but no generation occurs before login.
Text history stays in account-isolated `sessionStorage`; it is not persisted
server-side or passed silently into a lead.

The server uses Vercel AI SDK 7 and AI Gateway with exactly three read-only,
schema-validated tools: published property search, published property lookup,
and approved current knowledge search. It cannot mutate Sanity, construct GROQ,
submit leads, book viewings, send messages, initiate payments, rank housing
eligibility, or use arbitrary URLs. Database-backed account/IP throttles,
short-lived token reservations, and a stable global daily spend circuit breaker
limit abuse and cost. Detailed controls are in `docs/PROPERTY_ASSISTANT.md`.

## Feature flags

Keep these disabled until their own launch gates pass:

```dotenv
LEAD_INTAKE_ENABLED="false"
LEAD_DELIVERY_ENABLED="false"
PURCHASE_READINESS_ENABLED="false"
SAVED_CONTENT_ENABLED="false"
NEXT_PUBLIC_SANITY_SOCIAL_CAMPAIGNS_ENABLED="false"
PROPERTY_ASSISTANT_ENABLED="false"
```

The application and APIs fail closed; a merged PR is not approval to enable a
flag.

## Review and merge order

1. Review independent PRs #1, #3, #5, and #6 against current `main`.
2. After #1 merges, rebase/retarget and retest #2 and #4.
3. After #6 merges, rebase/retarget and retest #7.
4. After #1, #5, #6, and #7 are reconciled, rebase/retarget #8. Preserve both
   editorial and assistant-approval Sanity fields and the complete ordered
   Prisma migration history.
5. Replace PR #8's temporary legacy `BuyerModal` bridge with PR #1's shared
   `LeadEoiForm`, including canonical property context and durable API success.
6. Rerun lint, unit/integration tests, full Playwright, production build,
   disabled/enabled Lighthouse, and staging checks after every rebase.
7. Obtain explicit product, content, analytics, privacy, legal, infrastructure,
   and migration approval before enabling any production flag.

Never edit an applied migration. Back up and compare Railway's live schema,
mark only the immutable baseline as already applied where appropriate, and use
the checksum-bound `npm run db:migrate:approved` pre-deploy flow.

## Latest verification

On `suryak02/property-assistant` at commit `29ec75b9` on 1 September 2026:

- Prisma generate and validate passed.
- Assistant-scoped ESLint and TypeScript passed.
- All 101 Vitest tests passed.
- All 12 assistant Playwright tests and all 34 repository Playwright tests
  passed across desktop and mobile.
- The optimized production build passed with 76 routes.
- With the assistant flag off, its UI was absent and API returned `404`.
- Local disabled-flag Lighthouse on `/properties` scored 82 performance, 96
  accessibility, 96 best practices, and 100 SEO, with zero layout shift.

Repository-wide lint still has 76 errors and 29 warnings in pre-existing areas.
`npm audit --omit=dev` reports 21 transitive Prisma/Sanity-chain findings whose
automatic force fixes require breaking dependency changes. Handle both in
separate maintenance work rather than disguising them inside a feature PR.

## External launch blocks

- Sonia must approve lead, consent, AI, and payment-guide wording.
- Tanu must approve GA4/GTM/Meta mappings and verify analytics contains no PII.
- Deb must approve Railway access, checksummed migrations, staging, and deploys.
- Haus must provide the Power Automate flow, Excel table, Entra credentials,
  Sanity organisation/roles/staging dataset, Planner access, and owned social
  application credentials.
- The privacy policy still needs confirmed company/controller details and the
  approved enquiry, marketing, saved-content, session-storage, and AI supplier
  disclosures.
- The assistant needs company-owned Gateway billing/budgets, verified ZDR and
  no-training settings, vendor/DPA review, DPIA, housing/non-discrimination
  review, prompt-injection evaluation, live PostgreSQL concurrency testing, and
  authenticated Railway staging verification.
- Purchase readiness remains educational. No escrow provider, payment flow, or
  money movement can launch without market-specific regulated partners and
  legal approval.

## Deliberately deferred

Branded `/s/...` short links, persistent customer chat history, voice AI,
payments, escrow-provider integration, live social API publishing, newsletter
broadcasting/provider synchronisation, native social lead forms, calculators,
and a broader automated purchase journey are later workstreams. Do not fold
them into these draft PRs without a new branch, contract, safety review, tests,
and explicit company approval.
