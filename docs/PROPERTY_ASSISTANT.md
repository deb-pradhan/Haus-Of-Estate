# Haus Property Assistant

## Status

The property assistant is implemented on `suryak02/property-assistant` and is
disabled by default. It is an authenticated discovery aid, not an autonomous
estate agent, eligibility system, adviser, booking system, lead submitter, or
payment service.

`PROPERTY_ASSISTANT_ENABLED` must remain `false` in production and staging until
every launch gate in this document passes. A merged implementation is not an
approval to enable it.

## Branch and pull-request dependencies

The branch starts from saved-content PR #7, which is stacked on auth-hardening
PR #6:

1. Merge PR #6, `suryak02/auth-hardening`.
2. Rebase, retest, and merge PR #7, `suryak02/saved-content`.
3. Reconcile and merge Sanity editorial workflow PR #5. The assistant depends
   on company-owned Sanity access, publication controls, preview/revalidation,
   and reviewed assistant knowledge fields.
4. Reconcile lead-intake foundation PR #1 before enabling the assistant. PR #1
   is not an ancestor of this branch.
5. Rebase and retarget the property-assistant PR after those dependencies have
   landed, resolve schema and migration conflicts without rewriting an applied
   migration, and run the complete verification suite again.

The current adviser handoff still opens the legacy `BuyerModal`. It does not
carry a canonical property/project ID into the durable lead contract. The
legacy modal is only a temporary integration surface. Production launch is
blocked until it is replaced by the shared `LeadEoiForm` from PR #1, preserves
an editable structured brief, waits for durable lead persistence, and uses
approved privacy and enquiry wording. The assistant never submits a transcript.

## Architecture

### Request path

1. The server-only feature check in `src/lib/features.ts` controls whether the
   main layout mounts `PropertyAssistantProvider`. The API repeats the same
   check and returns `404` before authentication, body parsing, database work,
   or model construction when disabled.
2. The provider exposes a manual floating launcher on `/`, `/properties`, and
   property discovery/detail routes. The property listing also exposes a
   natural-language search entry. The panel is loaded lazily.
3. A visitor may compose a question while signed out. The draft is kept in
   `sessionStorage`, the visitor is sent through the sanitized auth return flow,
   and no model request is made until a server-authenticated session exists.
4. `DefaultChatTransport` sends only bounded user/assistant text parts to
   `POST /api/property-assistant`. Tool calls, tool output, files, sources, and
   reasoning parts are stripped client-side and rejected again server-side.
5. The route checks authentication and same origin, validates a strictly
   bounded JSON body, reserves database-backed usage, and streams an AI SDK UI
   message response.
6. A Vercel AI SDK 7 `ToolLoopAgent` uses the server-side AI Gateway model
   string. The default is `openai/gpt-5.6-luna`.
7. Tool output is validated into small DTOs before it reaches the model or UI.
   React renders plain text and validated links/cards, not model-authored HTML.

### Allowlisted tools

The agent has exactly three read-only tools:

- `searchPublishedProperties` searches current published Sanity properties
  with deterministic, parameterized filters and returns at most three cards.
- `getPublishedProperty` accepts strict immutable Sanity ID syntax and returns
  only a currently published document. Its policy directs the model to use an
  ID returned by property search; that sequence is not cryptographically bound
  to one conversation.
- `searchApprovedKnowledge` searches only published FAQ/article summaries that
  are explicitly assistant-approved, sourced, dated, and unexpired.

The model cannot construct GROQ, mutate Sanity, submit a lead, send a message,
book a viewing, initiate a payment, or call an arbitrary URL.

### UI and retention

- The assistant is visibly labelled as AI and warns that answers can be wrong.
- Ordinary property filters and the human-adviser route remain available.
- Property links and view-all links are canonical internal paths with bounded
  filter keys. Property cards are limited to three.
- The panel coordinates with the lead modal and homepage WhatsApp control so
  interactive overlays are not active together.
- Drafts and text-only conversation history are kept in versioned
  `sessionStorage`. History is scoped to a local authenticated-account marker
  and cleared on sign-out or account change; a guest's unsent draft can still
  survive the intended sign-in return. Closing the browser session removes all
  of it. No transcript is stored in PostgreSQL or Sanity.
- Analytics emits only `property_assistant_opened`,
  `property_assistant_results_shown`, and
  `property_assistant_adviser_handoff`, with route scope and a result count of
  at most three. It never includes prompts, names, email addresses, phone
  numbers, transcripts, property free text, or full referrers.

Tool cards are deliberately not trusted when restored from browser storage.
Any persisted handoff context must be treated as an editable hint and validated
again by the lead API after PR #1 is integrated.

## Environment

Use `.env.example` as the source of truth.

| Variable | Purpose |
| --- | --- |
| `PROPERTY_ASSISTANT_ENABLED` | Server-only kill switch. Default `false`. |
| `AI_GATEWAY_API_KEY` | Server-only Vercel AI Gateway credential. Required only when enabled. |
| `PROPERTY_ASSISTANT_MODEL` | Gateway model string. Default `openai/gpt-5.6-luna`; only reviewed `openai/*` identifiers are accepted. |
| `PROPERTY_ASSISTANT_USAGE_SECRET` | HMAC secret for account/IP usage keys. Use a distinct high-entropy production value. |
| `PROPERTY_ASSISTANT_DAILY_TOKEN_BUDGET` | Global UTC-day token-unit circuit breaker. Default `500000`. |
| `PROPERTY_ASSISTANT_SOURCE_HOSTS` | Comma-separated exact HTTPS citation hosts. Default allows only `hausofestate.com` and `www.hausofestate.com`. |
| `DATABASE_URL` | PostgreSQL used for usage buckets and reservations. |
| `AUTH_TRUST_PROXY_HEADERS` / `AUTH_CLIENT_IP_HEADER` | Reviewed proxy boundary used to derive the client IP before HMAC hashing. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` | Canonical Sanity project and dataset queried read-only. |

`PROPERTY_ASSISTANT_SOURCE_HOSTS` is an exact hostname allowlist, not a suffix
or wildcard list. Source URLs must use HTTPS and cannot contain credentials, a
custom port, an IP address, or localhost. URL fragments are removed. A malformed
configured list fails closed. Add an official external evidence host, such as a
regulator, only after editorial and security review; adding its parent domain
does not automatically approve subdomains.

The following limits are fixed in code unless a reviewed change updates them:

- 48 KB request body, eight messages, 2,000 characters per text part, 12,000
  total input characters, and an estimated 4,000 input-token ceiling.
- 800 output tokens by default, configurable only from 256 to 1,000.
- Four agent steps, three total tool calls, no model retry, and a 35-second
  total timeout with tighter first-chunk, chunk, and tool timeouts.
- Twelve requests per account and twenty requests per HMAC-hashed IP in each
  ten-minute fixed window.
- A default 500,000-token-unit global UTC-day budget with a conservative
  per-request reservation of at least 28,000 units and a two-minute lease.

## Security, privacy, and cost controls

- Disabled requests return `404` before any observable assistant work.
- Authentication occurs before the request body is read or any model/config
  code runs. Same-origin mutation checks remain authoritative server-side.
- The route accepts JSON only, reads it with a byte limit, rejects unknown body
  keys, rebuilds an alternating text-only history, and requires the first and
  final message to be from the user.
- System policy and tool descriptions treat prompts and Sanity data as
  untrusted. Tool inputs and outputs use strict Zod schemas. GROQ is fixed and
  parameterized.
- The assistant must not invent prices, availability, returns, fees, permits,
  verification, escrow status, or scarcity. It must not give personalized
  legal, mortgage, tax, financial, or investment-suitability advice.
- It must not make or assist unaudited housing eligibility, ranking, or access
  decisions and must not steer using protected or inferred traits.
- The UI warns users not to enter payment, bank, passport, identity, or other
  sensitive information. The application logs no prompts, transcripts, raw IP
  addresses, account IDs, or tool payloads.
- Account IDs and IP addresses are HMAC-hashed before entering usage buckets.
  The database stores counters, windows, and short-lived reservations only.
- Reservation and settlement run in serializable transactions with bounded
  conflict retries. Normal zero-use aborts release their reservation. Measured
  usage is recorded even when it exceeds the estimate. A lease that truly
  expires because its finalizer was lost is conservatively charged at the
  reserved estimate.
- Error bodies are generic. Reasoning and provider source parts are not sent to
  the browser.

The database circuit breaker counts token units; it is not a substitute for a
Gateway billing budget. Configure team/project/API-key spend alerts and a hard
budget in AI Gateway as a second control.

## AI Gateway and legal launch gates

Prompts must be sent to Vercel AI Gateway and its routed OpenAI provider to
generate an answer even though this application does not persist them. Before
enabling the flag:

1. Haus must own the Gateway team, API key, billing project, and provider
   policy. Restrict the provider/model allowlist to the approved route.
2. Enable and verify Zero Data Retention or an equivalent approved retention
   control, and disallow prompt training. The current code does not itself prove
   the team-level dashboard setting. Confirm enforcement in Gateway metadata
   and retain the approval evidence. See
   [Vercel's ZDR controls](https://vercel.com/changelog/zero-data-retention-no-prompt-training-on-ai-gateway)
   and [AI Gateway documentation](https://vercel.com/docs/ai-gateway).
3. Review whether Gateway request/content logs, Observability, runtime logs,
   log drains, and support access can expose prompts. Do not enable content
   logging. Limit access and retention, and document any unavoidable metadata.
4. Complete vendor and security review for Vercel and the routed OpenAI
   provider, including contracts/DPA, subprocessors, international transfers,
   retention, training, incident handling, and deletion/subject-request paths.
5. Complete a DPIA before launch and record purpose, necessity,
   proportionality, data flow, lawful basis, risks, mitigations, human route,
   and retention. See [ICO AI and data-protection guidance](https://ico.org.uk/media2/ga4lfb5d/guidance-on-ai-and-data-protection-all-2-0-38.pdf).
6. Obtain legal approval for housing, consumer, financial-content,
   non-discrimination, and geographic requirements. Obtain privacy approval for
   the exact controller identity and notice wording.
7. Update the privacy notice to explain session storage, prompt transmission to
   AI suppliers, purposes/lawful basis, hashed abuse-prevention data, retention,
   transfers, rights, and the human alternative.
8. Retain the clear first-interaction AI disclosure. EU-facing deployment must
   be reviewed against current transparency duties; see the
   [European Commission Article 50 guidance](https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations).

If ZDR, no-training, vendor, DPIA, legal, or privacy approval is missing, leave
`PROPERTY_ASSISTANT_ENABLED=false`.

## Database rollout

Migration `20260901003000_property_assistant_usage` adds:

- `PropertyAssistantUsageBucket`, uniquely keyed by scope and a non-reversible
  key. Account/IP keys are HMAC-derived; the non-PII global daily key is a
  stable application hash so rotating the HMAC secret cannot split the spend
  circuit breaker.
- `PropertyAssistantUsageReservation`, linked to the global bucket with expiry
  indexes and cascade deletion.

It stores no prompts, transcripts, raw IPs, account IDs, or Sanity content.

For the existing Railway database:

1. Keep `PROPERTY_ASSISTANT_ENABLED=false` and take a verified backup.
2. Compare the live schema and migration history with the immutable
   `20260901000000_baseline`. Resolve every discrepancy first.
3. If the existing database predates Prisma migration history, mark only the
   reviewed baseline as applied:

   ```sh
   npx prisma migrate resolve --applied 20260901000000_baseline
   ```

   Never execute the baseline SQL against the populated Railway database.
4. Confirm `20260901001000_auth_hardening` and
   `20260901002000_saved_content` were applied and verified in dependency order.
5. Configure Railway pre-deploy to run `npm run db:migrate:approved`. With the
   assistant migration pending, the first run must fail closed and print the
   exact required value:

   ```text
   HAUS_DATABASE_MIGRATIONS_APPROVED=20260901003000_property_assistant_usage@<reviewed-sha256>
   ```

   If more than one migration is pending, the value is the complete sorted,
   comma-separated set printed by the command.
6. Deb must compare every printed SHA-256 checksum with the reviewed immutable
   `migration.sql`. Set that exact value for one approved deployment only.
7. Run pre-deploy again so it executes `prisma migrate deploy`. Remove
   `HAUS_DATABASE_MIGRATIONS_APPROVED` immediately after success.
8. Verify both tables, indexes, foreign key, migration checksums, and zero
   unexpected rows. Exercise reservation, settlement, zero-use release, and
   expiry behavior against staging PostgreSQL before enabling the UI.

A fresh empty database may apply the complete migration history normally. Do
not run production migrations from a developer machine and do not edit an
applied migration.

## Verification

Run after every rebase and before staging approval:

```sh
npm run db:generate
npx prisma validate
npm run typecheck
npx eslint src/app/api/property-assistant src/components/property-assistant src/lib/property-assistant tests/unit tests/e2e/property-assistant-ui.spec.ts
npm test
npm run build
npm run test:e2e -- tests/e2e/property-assistant-ui.spec.ts
```

Final local branch verification on 1 September 2026: Prisma generate/validate,
targeted lint, TypeScript, the production build, 101 Vitest tests, 12 focused
assistant Playwright tests, and all 34 repository Playwright tests passed. The
repository-wide lint command still reports 76 errors and 29 warnings in
pre-existing scripts, legal pages, blog components, Sanity base types, and
search filters; no assistant-scoped lint finding remains.

Coverage currently includes:

- Strict request rebuilding, forged tool/file/reasoning-part rejection, message
  ordering, character/token limits, and model/config rejection.
- Disabled, unauthenticated, cross-origin, malformed, oversized, throttled,
  provider-failure, streaming, retry, and abort route behavior.
- Fixed parameterized Sanity queries, published-document validation, immutable
  IDs, taxonomy filters, maximum result counts, expired knowledge, image/path
  validation, and exact source-host allowlisting.
- Account/IP windows, global budget reservations, HMAC-secret rotation,
  expired-lease accounting, idempotent release/finalization, actual use above
  estimate, and mocked serializable-conflict retry.
- Desktop/mobile route gating, keyboard/focus behavior, session draft return,
  account-switch history isolation, text-only SDK transport, validated
  property results, adviser handoff, overlay coordination, retry feedback, and
  PII-free analytics shapes.

## Residual verification and launch checklist

The local suite uses mocks for Prisma, Sanity, authentication, and AI streams.
The following have not been performed from this branch:

- No migration has been run against a live PostgreSQL database or a
  production-shaped backup.
- No real PostgreSQL concurrency/interleaving test has validated serializable
  account/IP/global reservations under competing processes.
- No live AI Gateway/OpenAI request, abort, timeout, billing, ZDR, provider
  allowlist, or spend-circuit-breaker test has run.
- No real company-owned Sanity staging dataset or approved external source-host
  set has been exercised end to end.
- No authenticated Railway staging run, full accessibility audit, load test,
  penetration test, DPIA, vendor review, or legal/privacy approval has
  completed.
- A local Lighthouse run on `/properties` with the assistant disabled scored
  82 performance, 96 accessibility, 96 best practices, and 100 SEO. The
  inherited page still has a color-contrast finding and a 4.8-second lab LCP;
  treat those as pre-existing site performance/accessibility work, and repeat
  Lighthouse in production-shaped staging with the assistant both off and on.
- `npm audit --omit=dev` currently reports 21 transitive findings (12 moderate,
  9 high) in the existing Prisma/Sanity dependency chains. The automated
  force-fixes propose breaking Prisma/Sanity version changes; resolve these in
  a separately reviewed dependency-maintenance PR rather than during launch.
- The shared `LeadEoiForm` dependency remains unresolved, so adviser handoff is
  not production-ready even if every assistant-only test passes.

Before enablement, complete those checks; verify every returned property ID is
currently published; test prompt injection, discrimination, sensitive-data
warnings, expired guidance, provider failure, aborts, cost limits, mobile
overlays, auth return, and a durable adviser handoff; then obtain Sonia's
wording approval and Tanu's analytics approval.

Until all gates pass, the only acceptable production setting is:

```dotenv
PROPERTY_ASSISTANT_ENABLED="false"
```
