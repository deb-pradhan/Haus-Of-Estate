# Lead delivery rollout

PostgreSQL remains the source of truth. Each accepted enquiry and its immutable
delivery event are committed together. Power Automate maintains the Marketing
team's Excel view and sends the operational notification only after it appends a
new row.

## Feature flags and secrets

The web service and worker both default to disabled:

- `LEAD_INTAKE_ENABLED=true` exposes the intake experience.
- `LEAD_DELIVERY_ENABLED=true` permits outbound Power Automate requests. An
  outbox row is still created while this flag is false.
- `POWER_AUTOMATE_FLOW_URL` is the authenticated HTTP trigger URL and must use
  HTTPS.
- `POWER_AUTOMATE_TENANT_ID`, `POWER_AUTOMATE_CLIENT_ID`, and
  `POWER_AUTOMATE_CLIENT_SECRET` identify the restricted Haus service principal.
- `POWER_AUTOMATE_SCOPE` defaults to
  `https://service.flow.microsoft.com//.default`. The double slash is
  intentional: the public-cloud audience ends in `/`, and the OAuth scope adds
  `/.default`. Power Automate requires the token audience to match exactly.

Optional worker tuning variables are `LEAD_DELIVERY_BATCH_SIZE` (default 20),
`LEAD_DELIVERY_MAX_ATTEMPTS` (8), `LEAD_DELIVERY_LEASE_SECONDS` (600),
`LEAD_DELIVERY_BASE_DELAY_SECONDS` (300),
`LEAD_DELIVERY_MAX_DELAY_SECONDS` (21600), and
`LEAD_DELIVERY_TIMEOUT_MS` (8000). The timeout is a single budget shared by
token acquisition and flow delivery, so an immediate web attempt cannot wait
twice that duration.

Never expose these values through `NEXT_PUBLIC_*`, commit them, or paste them
into application logs.

## Power Automate flow

Create the flow in the Haus Microsoft tenant and keep ownership with a
company-managed account.

1. Use an HTTP request trigger with **Specific users in my tenant** selected.
   In Allowed users, enter the Haus enterprise service principal's **object
   ID**, not the application/client ID. Never leave Allowed users blank because
   that permits any user in the tenant. Enable trigger concurrency control with
   a degree of parallelism of one. Enable Secure Inputs and Secure Outputs on
   the HTTP trigger and every Excel or email action that handles lead data,
   wherever those settings are offered, so contact details are hidden from
   normal flow run history.
2. Reject payloads unless `schemaVersion` is `2.0` and `eventType` is
   `lead.created`.
3. Add a hidden `LeadDeliveryState` control table in the same restricted
   workbook with `event ID`, `lead ID`, `row added at`, and `notification sent
   at` columns. It contains no contact data and records which actions completed.
   Create or retrieve its record before performing either action.
4. If `row added at` is empty, list rows from the approved lead table by the
   exact `lead ID` column. Append `triggerBody()?['row']` only when that Lead ID
   is absent, then record `row added at`. This safely recovers when Excel
   succeeded but a prior flow run failed before acknowledging it.
5. If `notification sent at` is empty and the lead row exists, email the lead
   summary and workbook link to `info@hausofestate.com`, then record
   `notification sent at`. Do not send from an already-complete branch.
6. Return a Response action only after both state fields are present. Use HTTP
   201 when this run added the lead row or HTTP 200 when it resumed or replayed
   an existing event. The JSON body must echo the IDs and completion state:

   ```json
   {
     "schemaVersion": "2.0",
     "eventId": "stable-outbox-id",
     "leadId": "stable-lead-id",
     "rowAdded": true,
     "notificationSent": true
   }
   ```

   Set `rowAdded` to `true` only with the HTTP 201 new-row response. A complete
   replay or resumed HTTP 200 response must return `rowAdded: false` and
   `notificationSent: true`.

7. Do not return a lead's contact details in success or error responses. The
   application rejects bodyless/default `202` responses, mismatched IDs, and
   incomplete acknowledgements, leaving the outbox available for a safe retry.

The control table closes the common partial-failure gap where Excel succeeds
and email fails. Outlook email does not provide a transaction spanning its send
action and the following state update, so a platform interruption in that very
narrow interval can still produce a duplicate notification. The lead row
remains strictly deduplicated by Lead ID.

The Excel table headings, in order, must be:

`submission time`, `lead ID`, `name`, `email`, `phone`, `interest`, `market`,
`location`, `property type`, `bedrooms`, `bathrooms`, `timeframe`, `project`,
`property match opt-in`, `newsletter opt-in`, `source`, `campaign`, `landing
page`, `status`, `owner`, and `notes`.

The application sends this versioned contract:

```json
{
  "schemaVersion": "2.0",
  "eventId": "stable-outbox-id",
  "eventType": "lead.created",
  "leadId": "stable-lead-id",
  "row": {
    "submissionTime": "2026-08-29T12:00:00.000Z",
    "leadId": "stable-lead-id",
    "name": "Example Name",
    "email": "person@example.com",
    "phone": "",
    "interest": "invest",
    "market": "Dubai",
    "location": "",
    "propertyType": "apartment",
    "bedrooms": "2",
    "bathrooms": "2",
    "timeframe": "3-6 months",
    "project": "",
    "propertyMatchOptIn": true,
    "newsletterOptIn": true,
    "source": "instagram",
    "campaign": "bio",
    "landingPage": "/register-interest",
    "status": "New",
    "owner": "",
    "notes": ""
  }
}
```

Map the camel-case row properties to the corresponding displayed Excel headings
in the order above. The request also includes `Idempotency-Key: <eventId>` and
`X-Haus-Event-Version: 2.0`. User-controlled values that begin with an Excel
formula character are prefixed with an apostrophe before delivery, preventing
formula execution while preserving the displayed value.

The worker deterministically upgrades any immutable pending version `1.0`
outbox record to version `2.0` with `propertyMatchOptIn: false` before delivery.
This preserves pre-upgrade leads without inventing consent. The flow itself only
needs to accept version `2.0` after the application upgrade.

## Railway services

Keep the existing web service on `railway.json`. Create a second service from
the same repository and set its config path to `railway.worker.json`. Railway
will build `Dockerfile.worker`, start one bounded batch every five minutes, and
expect the process to terminate.

Set `DATABASE_URL` and all delivery variables on the worker. The web service
also needs the delivery variables if immediate post-commit attempts are enabled.
The database-backed lease prevents the web process and cron worker from
delivering the same outbox event concurrently. Power Automate's Lead ID check is
the final idempotency boundary.

## Production sequence

The feature must remain disabled until Haus has confirmed the legal identity,
registered address, company number, and monitored privacy contact currently
shown as placeholders in the Privacy Policy. Sonia must approve the enquiry and
marketing wording, and Tanu must approve the non-PII conversion events. The
workbook, flow, Entra application, Railway database backup, and live-schema
comparison are external launch dependencies; this repository does not create or
configure them.

1. Set both feature flags to false before changing the running release.
2. Back up the Railway PostgreSQL database and compare its live schema with the
   committed Prisma baseline before the first code deployment or pre-deploy run.
3. Against that verified live database, run
   `npx prisma migrate resolve --applied 20260829090000_baseline` from the
   reviewed branch. Confirm migration status reports only
   `20260829091000_lead_intake_foundation` as pending. Never mark an additive
   migration as applied and do not run a reset.
4. Deploy the code with both flags still false. The Railway pre-deploy command
   may now run `prisma migrate deploy`, which applies only the additive
   migration before the new application starts. When the qualifier branch is
   deployed later, the same controlled process applies
   `20260831100000_lead_intake_qualifiers`.
5. Configure the workbook, authenticated flow, service principal, and worker
   secrets. Leave delivery false.
6. In staging, enable delivery and submit one tracked test lead. Confirm exactly
   one database Lead, one outbox event, one workbook row, and one email. Repeat
   the same event to confirm no second row or email is created. Then force a
   failure between the Excel and email actions and verify the retry sends the
   missing email without adding another lead row.
7. Confirm Sonia has approved wording and Tanu has approved non-PII tracking.
   Enable intake in production, then delivery.

Monitor counts by outbox status, retry attempts, oldest pending `availableAt`,
dead-letter count, and web API error/rate-limit metrics. Logs intentionally
contain only event names and aggregate counts; contact details and flow response
bodies are never logged.

Retryable failures are `408`, `429`, `5xx`, timeouts, and network failures.
Other HTTP failures are dead-lettered. Retries start at five minutes and use
capped exponential backoff. A crashed worker's lease is recovered on a later
run. Investigate and correct the external cause before manually returning a
dead-letter row to `PENDING`.

## References

- Power Automate authenticated HTTP triggers:
  https://learn.microsoft.com/en-us/power-automate/oauth-authentication
- Microsoft Graph workbook-table permissions:
  https://learn.microsoft.com/en-us/graph/api/worksheet-post-tables?view=graph-rest-1.0
- Railway cron jobs:
  https://docs.railway.com/cron-jobs
