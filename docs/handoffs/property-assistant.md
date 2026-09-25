# Haus of Estate property-assistant handoff

Paste this into the separate ChatGPT account when continuing the work.

Repository: `deb-pradhan/Haus-Of-Estate`

Branch: `suryak02/property-assistant`, based on saved-content PR #7, which is
stacked on auth-hardening PR #6. Never push or merge directly to `main`.

## What is implemented

The branch adds the disabled-by-default Haus Property Assistant. It is an
authenticated, streaming property-discovery assistant built with Vercel AI SDK
7 `ToolLoopAgent` and AI Gateway. The default model is
`openai/gpt-5.6-luna`. It is not a housing eligibility system, adviser, lead
submitter, booking service, or payment service.

The server-only `PROPERTY_ASSISTANT_ENABLED` flag gates both UI and API. The API
returns `404` while disabled before authentication, body parsing, database
usage, or model construction. Signed-out visitors can draft a first question,
but login is required before generation. Drafts and text-only history stay in
versioned `sessionStorage`; history is isolated by a local authenticated-account
marker and cleared on sign-out or account change. The application stores no
transcript server-side.

The agent can call exactly three read-only, schema-validated tools:

- `searchPublishedProperties`
- `getPublishedProperty`
- `searchApprovedKnowledge`

They use fixed parameterized Sanity queries, return at most three published
properties, and expose only approved, sourced, dated, unexpired knowledge.
The model cannot construct GROQ, mutate content, submit leads, send messages,
book viewings, or initiate payments.

The UI includes a floating launcher, a natural-language property-search entry,
an accessible mobile sheet, validated property/source cards, ordinary-filter
links, human handoff, failure/retry states, AI and sensitive-data warnings, and
coarse PII-free data-layer events. WhatsApp and lead overlays are coordinated.

## Security and cost controls

The route requires an authenticated Auth.js session and same origin before model use.
It accepts only bounded JSON and rebuilds alternating text-only history,
rejecting forged tools, files, sources, reasoning, and client model overrides.
Prompts and Sanity text are untrusted. The policy prohibits invented listing or
financial facts, personalized legal/tax/mortgage/investment advice,
discriminatory steering, housing eligibility decisions, sensitive-data
collection, and silent transcript handoff.

PostgreSQL contains only HMAC-keyed account/IP usage windows, a stable non-PII
global daily bucket, and short-lived token reservations. The stable global key
prevents an HMAC-secret rotation from splitting the spend circuit breaker.
Defaults are 12 requests/account and 20/IP per ten minutes, a 500,000-token-unit
UTC-day circuit breaker, at least a 28,000 unit request reservation, four model
steps, three tool calls, 800 output tokens, and a 35-second total timeout.
Zero-use aborts release their reservation; lost finalizers charge the expired
estimate conservatively; measured use above the estimate is fully recorded.

Knowledge citations are restricted by the exact, comma-separated
`PROPERTY_ASSISTANT_SOURCE_HOSTS` allowlist. The default permits only Haus
hosts. HTTPS, no credentials, no custom port, no IP/localhost, and no wildcard
inheritance are enforced. Review every regulator/evidence hostname before
adding it.

## Dependency and launch block

Merge/reconcile in this order:

1. PR #6 auth hardening.
2. PR #7 saved content.
3. PR #5 Sanity editorial workflow and company-owned staging/publication setup.
4. PR #1 lead-intake foundation.
5. Rebase/retarget and review the property-assistant PR.

PR #1 is a separate branch line. The current assistant still hands off to the
legacy `BuyerModal`, not the shared `LeadEoiForm`, and does not carry a durable
canonical property/project ID into the lead contract. Keep the feature off
until that legacy bridge is replaced, the user reviews an editable structured
brief, the lead API confirms persistence, and Sonia approves the wording.

## Environment and migration

Required server settings are documented in `.env.example`:

```dotenv
PROPERTY_ASSISTANT_ENABLED="false"
AI_GATEWAY_API_KEY=""
PROPERTY_ASSISTANT_MODEL="openai/gpt-5.6-luna"
PROPERTY_ASSISTANT_USAGE_SECRET="replace-with-a-distinct-secret"
PROPERTY_ASSISTANT_DAILY_TOKEN_BUDGET="500000"
PROPERTY_ASSISTANT_SOURCE_HOSTS="hausofestate.com,www.hausofestate.com"
```

Migration `20260901003000_property_assistant_usage` is additive and has not
been applied to Railway. Back up and compare the live database, mark only
`20260901000000_baseline` as applied on the existing pre-migration database,
confirm auth `20260901001000` and saved-content `20260901002000` are present,
then run Railway's fail-closed `npm run db:migrate:approved` pre-deploy. It will
print the exact checksum-bound value, normally:

```text
HAUS_DATABASE_MIGRATIONS_APPROVED=20260901003000_property_assistant_usage@<reviewed-sha256>
```

Deb must compare the checksum with the reviewed SQL, approve it for that one
deployment, and remove the variable after success. Never execute the baseline
against the populated database, edit an applied migration, or migrate
production from a developer machine.

## External approvals still required

No live AI Gateway request has been run. Before launch, Haus must own the
Gateway team/key/billing, restrict the approved provider/model, configure hard
Gateway budgets, enable and verify Zero Data Retention and no prompt training,
and ensure Gateway request/content logs, Observability, runtime logs, and log
drains do not expose prompts. If those controls cannot be proven, do not enable
the feature.

Complete a Vercel/OpenAI vendor review, DPA/subprocessor/transfer/retention
review, DPIA, housing and consumer legal review, privacy notice update, AI
transparency review, and company/controller wording approval. Prompts are sent
to Gateway/OpenAI for inference even though Haus does not store transcripts.
The UI disclosure alone does not replace those reviews.

## Verification status

Local coverage includes agent input policy, strict route ordering, flag/auth/
origin/body limits, tool injection, current-published property validation,
approved/expiring knowledge, source-host allowlisting, account/IP/global usage,
abort and provider failures, full actual-use settlement, PII-free analytics,
desktop/mobile UI, auth draft return, SDK text-only transport, result cards,
account-switch isolation, overlay behavior, handoff, and retry.

Final local verification on 1 September 2026 passed Prisma generate/validate,
targeted lint, TypeScript, the production build, all 101 Vitest tests, all 12
focused assistant Playwright tests, and all 34 repository Playwright tests.
The repository-wide lint command still has 76 errors and 29 warnings in
pre-existing areas; no assistant-scoped lint finding remains. Rerun every check
after dependency rebases and record the new counts in the PR.

Important residual gates remain: no live PostgreSQL migration, no real
multi-process serializable-concurrency test, no production-shaped backup
replay, no live Gateway/OpenAI/ZDR/billing test, no company Sanity staging
exercise, no authenticated Railway staging test, and no final accessibility,
load, penetration, legal, privacy, vendor, or DPIA approval. A local
disabled-flag Lighthouse run on `/properties` scored 82 performance, 96
accessibility, 96 best practices, and 100 SEO; it retained an inherited color
contrast finding and 4.8-second lab LCP, so repeat it in production-shaped
staging with the assistant both off and on.

`npm audit --omit=dev` also reports 21 transitive findings (12 moderate, 9 high)
in the existing Prisma/Sanity dependency chains. Its force-fix suggestions are
breaking version changes, so address them in a separate reviewed dependency PR.

Detailed maintainer instructions are in `docs/PROPERTY_ASSISTANT.md`.

Never enable `PROPERTY_ASSISTANT_ENABLED` until every dependency, migration,
content, privacy, legal, vendor, cost, and staging gate has passed.
