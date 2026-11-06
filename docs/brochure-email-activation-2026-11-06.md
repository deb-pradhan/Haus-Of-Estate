# Florence brochure email — activation checklist (6 November 2026)

Status: **preparation only.** Nothing in this note enables intake, delivery,
email sending, Sanity publication or hosted storage. It records what the
repository can do once the external approvals and services exist, what this
increment changed, and exactly which steps remain blocked and by whom.

The public website already contains one pipeline and this work reuses it:
`PropertyDesignExplorer` → `PropertyBrochureRequestTrigger` → `LeadEoiForm` →
`submitLeadEnquiry` (`POST /api/leads`) → server-side published Sanity mapping
(`src/lib/lead-intake/project.ts`, `service.ts`) → PostgreSQL lead, consent and
outbox rows in one transaction (`persistence.ts`) → immediate attempt plus the
five-minute worker (`src/lib/lead-delivery`) → Resend brochure transport with a
signed seven-day download link (`src/lib/lead-delivery/brochure.ts`,
`src/lib/brochures/links.ts`) → private download route
(`src/app/api/brochures/[token]/route.ts`) → Resend webhook receipts
(`src/app/api/webhooks/resend/route.ts`). The `/showcase` fixture journey is a
simulation with no intake, tracking or email and stays that way.

`GET /api/leads` reports configuration readiness only. It is not proof that a
chosen PDF is approved, that a mapping is published, or that an email reached
an inbox.

## What this increment changed

1. **Honest brochure receipts.** The route used to return `brochureQueued: true`
   even when the immediate delivery attempt dead-lettered the customer brochure
   job, and an idempotent replay only checked that a `customer_brochure` outbox
   row existed. Persistence now returns the brochure job identifier and
   describes a `DEAD_LETTER` row as a permanent failure; the route reports
   `brochureDeliveryFailed: true` instead of `brochureQueued` in that case. The
   saved-lead receipt, HTTP status codes and replay idempotency are unchanged.
   The form says the request is saved for team follow-up and that there is no
   need to send it again; it never claims delivery. Retries, worker leases,
   disabled delivery and a dead-lettered *staff* notification leave the brochure
   reported as queued.
2. **Failed-save fallback** names `sales@hausofestate.com`, the agreed sales
   inbox, instead of `info@`.
3. **Per-selection availability.** The design explorer tells the request button
   whether the selected published design carries a collection brochure key. An
   unmapped design now opens an enquiry that keeps the design in the note
   (`emailUnavailable`), instead of a brochure request that the server would
   reject after the visitor has typed their details. Mapped designs behave as
   before. While `BROCHURE_EMAIL_ENABLED` is off nothing visible changes.
4. **Mapping audit.** `npm run brochure:mapping` (needs `BROCHURE_CATALOG_PATH`
   or `--catalog <absolute path>`) compares the private catalog with the
   published collection documents and prints, per collection, whether every
   published design resolves to the approved key and revision, with reason
   codes such as `DESIGN_MISSING_BROCHURE_KEY`, `DESIGN_REVISION_MISMATCH`,
   `COLLECTION_MIXED_KEYS` and `CATALOG_NOT_APPROVED`. It is read-only against
   the published perspective and prints slugs, design labels and codes only.

Tests added or extended: `src/app/api/leads/route.test.ts`,
`src/lib/lead-intake/persistence.test.ts`, `src/lib/lead-intake/client.test.ts`,
`src/components/lead-eoi/brochure-request.test.tsx`,
`src/lib/brochures/mapping-check.test.ts`, `scripts/check-brochure-mapping.test.mjs`.
All run with mocks and temporary files; no email, database or Sanity call is
made by any test.

## Approved mapping (held, `approved: false`)

The catalog prepared on 20 October 2026 lives outside Git at
`C:/Users/surya/Downloads/Haus-brochure-email-preparation-2026-10-20` with
four source PDFs (18–74 MB). It stays private: never Git, `public/` or a public
Sanity asset. The revision is the verified source SHA-256.

| Catalog key | Collection slugs | PDF |
| --- | --- | --- |
| `villa-4br` | `azizi-florence-4-bedroom-villas` | one 4BR villa brochure |
| `villa-5br` | `azizi-florence-5-bedroom-villas` | one 5BR villa brochure |
| `villa-6br` | `azizi-florence-6-bedroom-villas` | one 6BR villa brochure |
| `townhouse-3-4br` | `azizi-florence-3-bedroom-townhouses`, `azizi-florence-4-bedroom-townhouses` | one combined 3/4BR townhouse brochure |

Design-level requests name the chosen design in the customer email
(`designLabel`) and deliver the collection PDF. There are no per-design PDFs and
none are implied. The server only accepts a design whose published
`brochureKey` and `brochureRevision` match an approved catalog entry that lists
the collection slug (`service.ts`, `catalog.ts`); a collection-level request is
accepted only when every design in the collection shares one approved key.

Before activation an authorised editor must set `brochureKey` and
`brochureRevision` on every published Florence design variant (Sanity edit,
not done here), and Sonia must confirm each file-to-collection mapping before
`approved` is set to `true` in the private catalog. `npm run brochure:mapping`
should then report every collection as `ready`.

## Hosted private storage

Runtime contract (`src/lib/brochures/catalog.ts`): `BROCHURE_FILES_ROOT` and
`BROCHURE_CATALOG_PATH` are absolute paths, resolved with `realpath`, rejected
inside Next's `public/` directory; the file must start with `%PDF-`; the full
SHA-256 is verified before an email is sent and again before a download is
streamed; approval is re-checked at send time so a withdrawn file cannot be sent
from an old queue. Download links are HMAC-signed (`BROCHURE_LINK_SECRET`),
expire seven days after the durable outbox event, and stop working as soon as
the catalog entry is withdrawn or its revision changes.

Both the web service (download route and immediate attempt) and the delivery
worker (full-hash check before sending) therefore need read access to the same
files. Railway deploys them as two services (`railway.json`, `railway.worker.json`),
and a Railway volume attaches to a single service. Confirm this when creating
the volume; it decides between:

- **A. Single-service delivery (no new service).** Mount a private volume on the
  web service at, for example, `/data/brochures`, copy `files/` and
  `catalog.json` there, set `BROCHURE_FILES_ROOT=/data/brochures/files` and
  `BROCHURE_CATALOG_PATH=/data/brochures/catalog.json`, and run the delivery
  batch from the web service instead of the separate cron service. The code for
  that trigger (an authenticated internal run endpoint or an in-process schedule)
  is not written; it would reuse `runConfiguredLeadDeliveryWorker` unchanged.
- **B. Private object storage.** An S3-compatible private bucket readable by both
  services behind a storage adapter in `catalog.ts`, with downloads served from
  short-lived signed object URLs after the existing token check. Not written;
  it needs a provisioning and cost decision first.

Vercel is not a delivery host for this feature: the preview project exists for
the `/showcase` simulation only, it has no persistent filesystem, and streaming
an 18–74 MB PDF through a function is not acceptable. Leave
`BROCHURE_EMAIL_ENABLED`, `LEAD_INTAKE_ENABLED` and `LEAD_DELIVERY_ENABLED` unset
there.

## Required hosted database and migrations

Pending migrations beyond the deployed Release 1 baseline, applied only through
the reviewed `db:prepare-release` path with `HAUS_DATABASE_MIGRATIONS_APPROVED`
set to the exact approved set after a backup and live-schema comparison:
`20260925120000_lead_delivery_destinations`,
`20261020120000_customer_brochure_delivery` and
`20261022120000_resend_webhook_events`, following the earlier lead-intake
migrations listed in `docs/lead-delivery-rollout.md`. Do not run `migrate reset`
or mark additive migrations as applied.

## Runtime settings (web service and worker)

Server-only; never `NEXT_PUBLIC_*`, never committed, never pasted into logs or
chat. Values are not recorded here.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL`, `LEAD_RATE_LIMIT_SECRET` | durable intake, throttle and outbox |
| `LEAD_INTAKE_ENABLED=true` | exposes the form and `POST /api/leads` |
| `LEAD_ALLOWED_ORIGINS=https://hausofestate.com` plus `NEXT_PUBLIC_SITE_URL` | origin check on submissions |
| `LEAD_DELIVERY_ENABLED=true`, `LEAD_DELIVERY_PROVIDER=resend` | outbound delivery through the worker and immediate attempt |
| `LEAD_NOTIFICATIONS_ENABLED=true`, `LEAD_NOTIFICATION_TO=sales@hausofestate.com` | staff notification with the buyer's address as Reply-To |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL=noreply@hausofestate.com` | verified sender (DNS verification complete; no Namecheap change needed) |
| `BROCHURE_EMAIL_ENABLED=true`, `BROCHURE_REPLY_TO=sales@hausofestate.com`, `BROCHURE_PUBLIC_ORIGIN=https://hausofestate.com`, `BROCHURE_LINK_SECRET` (≥ 32 random characters), `BROCHURE_FILES_ROOT`, `BROCHURE_CATALOG_PATH` | customer brochure email and private download links |
| `RESEND_WEBHOOK_ENABLED=true`, `RESEND_WEBHOOK_SECRET` | authenticated delivery receipts at `/api/webhooks/resend` (append-only events, not inbox proof) |
| Worker schedule | `railway.worker.json` runs one bounded batch every five minutes (`*/5 * * * *`); retries use capped exponential backoff, eight attempts, then dead letter |

Marketing consent stays optional, unticked and separate from the requested
brochure; the brochure is delivered regardless of the marketing choices.

## Verification done here (synthetic data and mocks)

- Valid and invalid published property/design mapping, including mixed keys and
  revision mismatches (`service.test.ts`, `mapping-check.test.ts`).
- Missing or unapproved file rejected before the throttle with an honest
  brochure field error; temporary storage failure keeps the selection for retry
  (`service.test.ts`, `catalog.test.ts`).
- Marketing unchecked still queues the requested brochure (`route.test.ts`,
  `persistence.test.ts`).
- Failed save is not a success; the receipt says saved or queued, never
  delivered; a dead-lettered brochure job is reported for follow-up without a
  resubmission prompt (`route.test.ts`, `client.test.ts`, `brochure-request.test.tsx`).
- Retry, idempotency and no duplicate sends (`worker.test.ts`, `brochure.test.ts`,
  `persistence.test.ts`); customer and sales routing
  (`sales-routing.integration.test.ts`); valid, expired, tampered and revoked
  private links (`src/app/api/brochures/[token]/route.test.ts`,
  `catalog.test.ts`, `brochure.test.ts`); webhook authentication
  (`src/app/api/webhooks/resend/route.test.ts`); the showcase simulation remains
  isolated (`src/lib/showcase/*.test.ts`).

Not verified and not claimed: real inbox receipt, real download of an approved
PDF from hosted storage, worker runs against the hosted database, webhook
delivery from Resend. Those need the controlled staging test below.

## Activation sequence (blocked steps in bold)

1. **Sonia confirms** the four file-to-collection mappings, current stock and
   marketable designs, and the sales follow-up owner; **SRERD approval status**
   for public Florence advertising is confirmed.
2. **Editor sets** `brochureKey`/`brochureRevision` on every published Florence
   design; `npm run brochure:mapping` reports all collections `ready`.
3. **Owner decides** storage layout A or B; files and catalog are copied to the
   private location; `approved: true` is set only after step 1.
4. Database backup, schema comparison, approved migrations through
   `db:prepare-release`.
5. Runtime settings above on web and worker with every flag still `false`;
   `npm run brochure:check -- --check-files` passes against that environment.
6. Staging: enable intake and delivery, submit one tracked request, confirm one
   lead, three outbox rows, one customer email with the correct collection link
   and Reply-To `sales@hausofestate.com`, one sales notification, a working
   download, a 404 after revocation, and a replay with no second email.
7. Production: enable intake, then delivery, then brochure email; watch outbox
   status counts and dead letters.
