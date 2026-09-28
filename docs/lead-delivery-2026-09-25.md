# Enquiry receipt and delivery — 25 September 2026

## Implemented locally

`/api/leads` confirms receipt only after its database transaction succeeds. The same transaction saves the enquiry, any separately selected marketing consent, and two outbox records: `notification` and `google_sheets`. Each destination has its own lease, attempts, retry time, delivered timestamp and dead-letter state. One destination failing does not resend the other. New enquiries retain both records even while outbound delivery is disabled.

The older `/api/funnel` endpoint now delegates to that durable API. The matching quiz uses the current privacy acknowledgement and requires email; it does not infer marketing consent, fabricate matching properties, or promise a response time. Account, buyer and seller modal requests retain their submission reference for an unchanged retry and show an error instead of success on failed or malformed responses. The main enquiry forms also validate the saved receipt. Seller passport/title-deed upload controls were removed because they never uploaded their selected files.

Public intake requires `LEAD_INTAKE_ENABLED=true`, a nonblank `DATABASE_URL`, and, in production, `LEAD_RATE_LIMIT_SECRET`. These checks establish configuration presence, not database connectivity or working delivery. Database failures still return an error. A successful receipt means the enquiry is saved; it does not prove inbox receipt or a Sheet row.

The previous untracked legacy email fallback is no longer called. All enquiries use the durable outboxes. Provider errors store only an error code; lead data, private keys, tokens and provider response bodies are not logged.

## Hosted dependencies and activation

1. Review and apply the new destination migration through the existing exact pending-set checksum approval process in `prisma/migrations/README.md`. No database migration was executed during this work.
2. **Stop the old delivery worker before new destination rows are created.** Deploy the destination-aware app and worker together, then resume the worker. The old worker cannot distinguish a Sheets record from an email notification. Do not run it or roll it back against the new queue. Keep delivery disabled during a failed rollout and reconcile the queue before recovery.
3. Configure a company notification provider and verify its sender and receiving inbox. `LEAD_DELIVERY_PROVIDER=resend` reuses the careers mail service with `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `LEAD_NOTIFICATION_TO`. The sender defaults to `noreply@hausofestate.com`; the recipient must be explicitly configured. Power Automate remains the legacy default; ZeptoMail also remains supported.
4. Obtain Sonia's approved Google spreadsheet ID and tab name, and a company-managed service account shared only with the intended spreadsheet. Enable the Sheets API for its project. Put its credentials in server-only `LEAD_GOOGLE_SERVICE_ACCOUNT_JSON`, and set `LEAD_SHEETS_SPREADSHEET_ID` and `LEAD_SHEETS_TAB_NAME`. No browser-visible key, domain-wide delegation or personal Gmail session is used.
5. Prepare an approved dedicated tab with the exact header row below. The adapter verifies it and will not create a tab, replace headers or guess the layout of an existing business sheet.
6. Keep `LEAD_DELIVERY_ENABLED=false` and `LEAD_SHEETS_ENABLED=false` until the corresponding hosted checks are authorised. Turning delivery on can process pending records, including earlier held submissions; review the backlog first. `LEAD_SHEETS_ENABLED=false` leaves Sheets records pending without consuming attempts. Missing enabled credentials fail independently and never mark the destination delivered.
7. Schedule the existing `npm run lead-delivery:worker` after configuration. Verify a controlled hosted enquiry is saved once, arrives in the company inbox and appears once in the approved Sheet. Test rejection/failure paths and inspect both outbox states. Only then activate public intake for customers.

The 23 columns in A:W are:

```text
delivery event ID | submission time | lead ID | name | email | phone | interest | market | location | property type | bedrooms | bathrooms | timeframe | project | property match opt-in | newsletter opt-in | overseas cash buyer | source | campaign | landing page | status | owner | notes
```

The adapter appends values with `valueInputOption=RAW`, preserves existing rows and staff edits, and checks the first-column delivery event ID before every append. Keep those IDs intact. This is best-effort duplicate prevention around a leased worker, not an atomic uniqueness guarantee from Sheets. An ambiguous append is retried by checking for the event first. A request that completes unusually late or an expired lease overlapping another worker can still require duplicate reconciliation. Google documents [append behaviour](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append) and [service-account authorisation](https://developers.google.com/identity/protocols/oauth2/service-account).

Resend uses a stable outbox-derived idempotency key. Its [24-hour retention window](https://resend.com/docs/dashboard/emails/idempotency-keys) is handled conservatively: an unattempted old record may make its first delivery, but any retry when the outbox is at least 23 hours old is dead-lettered for manual reconciliation. The bound uses the persisted outbox creation time, not the customer submission timestamp. Thus a long-held record that fails on its first attempt may require manual review immediately rather than a blind resend. Provider acceptance alone is not inbox receipt. Existing ZeptoMail delivery remains at least once; its tracking reference is not an idempotency guarantee.

## Evidence and limits

### Production browser verification

Run `npx playwright test --config playwright.lead-production.config.ts` for the
existing desktop/mobile lead suite against a dedicated production build. The
harness builds `.next-lead-browser` with intake disabled and no database or
service credentials, then starts that same artifact with intake enabled, a
fixed test-only rate-limit secret and an unusable loopback database URL. It
refuses to reuse a running server. Authentication, careers intake and outbound
delivery remain disabled. The server script inherits only operating-system
essentials and blanks dotenv-declared keys before Next.js can load local secret
values. Tests intercept enquiry submissions; this verifies runtime activation
and the browser/API response contract, not real database or inbox receipt. Do
not run simultaneous builds into that directory.

Before the runtime rendering fix, a 25 September check demonstrated
mixed behaviour: the home route evaluated runtime readiness while prerendered
About/register-interest content retained the build-time disabled state. Server
environment variables evaluated during prerendering become part of that rendered
output even though they are not `NEXT_PUBLIC_` variables.

The Docker build intentionally receives public build arguments only. Do not add
database passwords, service-account keys or mail tokens to Docker build arguments
to work around this. The root layout now awaits Next.js `connection()` before
feature readiness probes; the independently served XML sitemap awaits its own
request boundary. This makes those checks use runtime configuration without
putting secrets in the build. Page routes consequently render at request time
instead of using full-route prerendered output; explicit data-fetch caching
remains available. Focused regression tests hold the request boundary open,
change the runtime configuration and verify it is read after that boundary.
The root-layout/sitemap tests passed 13 checks, the harness credential-isolation
test passed, and scoped lint passed. The final production browser result is
recorded in the release report after the dedicated build and test run.

Prisma client generation completed locally without migration execution. The focused intake/delivery suite passed 162 tests in 18 files, including persistence failure, independently retried destinations, lazy independent credentials, malformed/failed receipts, stable retry references, disabled Sheets writes, header mismatch, API rate limits and ambiguous append recovery. Scoped lint passed. Root release verification records the final aggregate checks.

No customer data was sent, no mail was sent, no remote Sheet was read or changed, and no production service or environment was configured. Credentials, Sonia's actual spreadsheet/tab, database schema state, sender verification, scheduled worker execution and final hosted inbox/Sheet receipt remain unverified.
