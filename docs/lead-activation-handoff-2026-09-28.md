# Lead capture activation handoff — 28 September 2026

The standalone Google Form has recorded a controlled response in the existing Google Sheet. The normal website enquiry form has a database/outbox/Google Sheets implementation, but its hosted database, worker, service credentials and actual delivery have not been verified. The Form result does not establish that the website popup or `/register-interest` writes to the Sheet.

Deb can activate the existing website integration without giving Surya Railway access, by completing the hosting steps below and returning the verification evidence. Authentication, saved accounts and AskHaus can remain disabled throughout.

## Working interim capture

- Public responder link for Sonia to share: [Haus enquiry form](https://forms.gle/7fwMEN83ySQoMhps8). The short link was opened and verified against the published form.
- [Form editor](https://docs.google.com/forms/d/1WdLU-4qdset6PUR6oWt-03Lk3gxstfrBXS2ExBrrEEo/edit) and [response tab](https://docs.google.com/spreadsheets/d/1VTc6AFWWBvm5RZP1t6WIEkdy1WsTFG9hI04s53j2EiE/edit?gid=1390037075#gid=1390037075).
- Created through the existing Sheet's **Tools → Create form**. Responses use its new **Form responses 1** tab, `gid=1390037075`. This tab is separate from the 23-column website delivery tab described below.
- The form collects email through **Responder input**, with required name, enquiry category, brief and privacy acknowledgement. Phone and market are optional. It has no marketing subscription fields, response emails or outreach automation.
- Published responder access is **Anyone with the link**; editor access remains **Restricted**. The one-response restriction is off. A signed-out browser check has not yet been completed.
- Controlled receipt verified on 28 September: `Form responses 1!A2:H2` contains marker `HAUS-FORM-CHECK-20260928`, test address `haus-form-check-20260928@example.invalid` and displayed timestamp `28/09/2026 10:55:43`. `A3:H3` was blank. Invalid email rejection was checked first. Retain the clearly marked test row as verification evidence; it is not a customer lead.
- Surya is the creator/owner; `info@hausofestate.com` was retained as an editor. This is not yet company ownership. Sonia/company administration should agree the long-term owner and review both Form and Sheet access separately.
- Public result summaries are off; respondents cannot view the collected response summary. Response editing and the submit-another link are off. The form uses Haus green `#1f4d36` and a clickable link to the existing `/legal/privacy-policy` page. That public page was reachable during this check but still contains older content; the revised policy remains in Release 2.
- A current Google Cloud project search for `haus` returned no resources in Surya's signed-in account. No company service account, API key, Cloud project, sender or hosting service was created. This search does not prove that the company has no project under another name.

The standalone link can be used without changing Railway or the website. Replacing a website button or popup with it still requires a website change and deployment. Native Forms responses do not enter the website database or its delivery queue automatically. Google documents [linking responses to a Sheet](https://support.google.com/docs/answer/2917686?hl=en) and [publishing a responder link](https://support.google.com/docs/answer/2839588?hl=en).

## One setup list for Deb: normal website form

### 1. Agree the destinations and release

Surya supplies the reviewed Release 2 revision; Deb confirms the actual revision deployed. Sonia confirms the intended spreadsheet, a dedicated website tab, the monitored company notification inbox and enquiry wording. A company Google administrator supplies a company-managed service account with the Sheets API enabled and editor access to only the intended spreadsheet. Neither a personal Gmail login nor website account authentication is needed.

For the smallest hosting setup, let the web service save enquiries and let the scheduled worker deliver both destinations. Keep immediate web delivery off; the next scheduled worker run handles delivery, normally within the five-minute schedule when healthy. This keeps mail and Google private keys out of the web service. Do not describe a saved receipt as inbox or Sheet delivery.

### 2. Prepare the database under the existing migration gate

Deb must back up the actual hosted PostgreSQL database, compare its schema and migration history, and resolve any baseline discrepancy before SQL runs. Do not assume that the hosted schema matches the repository or mark an additive migration as applied.

Stop the previous delivery worker before deploying code that creates destination-specific rows. Deploy the destination-aware web app and worker together. The old worker cannot distinguish a Sheets event from a notification event and must not consume the new queue.

The web service retains `railway.json`, `Dockerfile`, `node server.js` and the pre-deploy command `npm run db:prepare-release`. When intake or delivery is enabled, that wrapper runs `npm run db:migrate:approved`. Its fail-closed output identifies the **complete pending migration set and checksums**. After reviewing that exact set, Deb supplies its exact `HAUS_DATABASE_MIGRATIONS_APPROVED` value for the authorised rollout, then removes it. Never copy a historical approval string or bypass the gate. The pending set may include older migrations even while authentication remains off.

The new `20260925120000_lead_delivery_destinations` migration preserves existing notification states and adds separate destination support. It does not backfill historical enquiries into Sheets. See [migration controls](../prisma/migrations/README.md) and [database preparation](content-release-database-gate.md).

### 3. Set server-only variables

The following is the intended configuration **after** controlled verification. Start with intake/delivery/Sheets flags false during preparation; enable them only for the authorised test and release. Store real values in Railway's secret configuration, not Git, build arguments, browser variables or this document.

| Variable | Web service | Scheduled worker | Required value / responsibility |
| --- | --- | --- | --- |
| `DATABASE_URL` | Required | Required | Deb: same verified hosted PostgreSQL database, reachable from both services |
| `LEAD_RATE_LIMIT_SECRET` | Required | Not needed | Deb: a strong random production-only secret; do not use the example placeholder |
| `LEAD_INTAKE_ENABLED` | `true` after checks | `false` | Opens public forms; configuration presence is not a connectivity test |
| `LEAD_DELIVERY_ENABLED` | `false` for this minimal setup | `true` after checks | Worker delivers; web only saves the durable receipt |
| `LEAD_SHEETS_ENABLED` | `false` | `true` after checks | Enables Google writes; false leaves those events pending |
| `LEAD_SHEETS_SPREADSHEET_ID` | Not needed | Required | `1VTc6AFWWBvm5RZP1t6WIEkdy1WsTFG9hI04s53j2EiE`; this is the existing approved spreadsheet, not its numeric tab `gid` |
| `LEAD_SHEETS_TAB_NAME` | Not needed | Required | Exact approved dedicated website tab name |
| `LEAD_GOOGLE_SERVICE_ACCOUNT_JSON` | Not needed | Required | Company service-account JSON containing its email and RSA private key |
| `LEAD_DELIVERY_PROVIDER` | Not needed | `resend` if chosen | Explicitly choose; otherwise the code defaults to legacy Power Automate |
| `RESEND_API_KEY` | Not needed for leads | Required for Resend | Existing authorised company Resend account/key, if available; availability unverified |
| `RESEND_FROM_EMAIL` | Not needed for leads | Required for agreed sender | One authorised, verified `@hausofestate.com` sender; code fallback is `noreply@hausofestate.com`, not proof that it is verified |
| `LEAD_NOTIFICATION_TO` | Not needed | Required for Resend | Sonia confirms one monitored `@hausofestate.com` recipient; no new recipient is assumed here |
| `AUTH_ENABLED`, `SAVED_CONTENT_ENABLED`, `PROPERTY_ASSISTANT_ENABLED` | `false` | `false` | Keep accounts and AskHaus deferred |
| `HAUS_DATABASE_MIGRATIONS_APPROVED` | Temporary exact reviewed value | Not needed | Only for the authorised migration step; remove after rollout |

If immediate post-save delivery is later enabled on the web service, it also needs the same delivery destination configuration and secrets. Careers sender configuration is separate from this minimal lead web setup. Power Automate and ZeptoMail remain supported if Haus already operates one; switching is not required merely because Resend support exists.

The canonical `https://hausofestate.com` and `https://www.hausofestate.com` origins are already permitted. For a controlled staging host, Deb must add that exact origin through `LEAD_ALLOWED_ORIGINS` or the configured site URL; do not widen origin access indiscriminately.

### 4. Prepare the website Sheet tab and scheduled worker

Use a dedicated tab, not `Form responses 1`. The adapter requires these exact 23 headings in `A1:W1`, in order, and does not create or repair the tab:

```text
delivery event ID | submission time | lead ID | name | email | phone | interest | market | location | property type | bedrooms | bathrooms | timeframe | project | property match opt-in | newsletter opt-in | overseas cash buyer | source | campaign | landing page | status | owner | notes
```

In Railway, Deb creates or updates a separate service from the same reviewed repository revision and sets its config path to `railway.worker.json`. That uses `Dockerfile.worker`, starts `node dist/process-lead-deliveries.cjs`, and runs one bounded batch on `*/5 * * * *` with no restart loop. Use this worker image, not the web image with an improvised command. Defaults are 20 events per batch, eight attempts, a ten-minute lease and an eight-second delivery timeout; existing retry/backoff settings need no change for initial activation.

Both new destination events are saved atomically with the enquiry. Each has independent retry state. Sheets failure does not cause a successful staff notification to resend, and vice versa. However, notification is always an enabled destination when global delivery is on: **there is currently no clean Sheets-only switch**. Missing mail credentials do not block a Sheets attempt but will generate failed notification retries/dead letters. Do not treat omitted mail configuration as an intentional supported email-off mode. A dedicated notification flag would be a separate small code change if Sonia wants Sheets-only delivery.

### 5. Return proof before opening public intake

Deb and Sonia should complete one designated test and return a concise evidence record: deployed revision, migration status, successful worker run, one saved Lead, two matching destination events, one Sheet row and actual arrival in the approved staff inbox. Repeating the submission reference must not create another Lead. Exercise a destination failure/retry and confirm the already-delivered destination is not resent. Review pending historical events before enabling delivery, since turning it on can release that backlog.

Preserve delivery event IDs in the Sheet. The adapter uses raw cell values and checks the ID before appending, but Sheets lookup-plus-append is not an atomic uniqueness guarantee. Reconcile an ambiguous/late append before manually resetting a failed event. Resend retries stop conservatively when an already-attempted outbox is 23 hours old; those ambiguous records need manual reconciliation. Monitor pending age, attempts and dead letters without logging personal data.

The current website readiness gate requires the intake flag, database URL and production rate-limit secret. It does not verify the database schema or downstream delivery. The API confirms receipt only after a successful database transaction. See [delivery design and verification limits](lead-delivery-2026-09-25.md).

## Email outreach and cookies are separate milestones

| Capability | Current position | Remaining dependency / proposed owner |
| --- | --- | --- |
| On-screen enquiry receipt | Implemented after durable database save | Deb activates verified hosted intake; Surya checks UI/API receipt |
| Staff notification and Sheet capture | Implemented as independent outbox destinations | Deb/company Google and mail admins configure; Sonia confirms actual receipt and monitoring |
| Automatic acknowledgement to the enquirer | Not implemented by the staff notification transport; Form response emails are off | Sonia approves acknowledgement copy/purpose; Surya adds a distinct customer receipt action and deduplication; Deb verifies sender and actual test receipt |
| Newsletter and matching-property consent | Website records separate optional choices and consent evidence | Hosted database activation; keep historical consent scope intact; interim Form does not subscribe anyone |
| Personalised marketing follow-up | Planned Release 2 milestone, not an operational campaign system | Sonia/Surya agree eligibility, interests, content selection, timing, frequency, review policy and retention; implement a separate customer queue, delivery and suppression lifecycle |

Accepting analytics cookies neither supplies an email address nor selects newsletter/property-match permission. Current analytics deliberately sends allowed measurement fields rather than contact details or enquiry text. The cookie controls do not connect anonymous browsing to an email campaign list. Website enquiries can be handled when optional marketing boxes are clear; ordinary enquiries must not become subscriptions.

The smallest marketing pilot can use explicitly opted-in subscribers without enabling accounts or AskHaus. It still needs a verified recipient/subscriber flow, approved templates and eligible published content, a company-owned sender/provider, deduplication and scheduled delivery, unsubscribe links and suppression checked at send time, bounce/complaint handling, and actual test-recipient receipt. Existing consent withdrawal helpers are groundwork, not a complete public unsubscribe/campaign journey. Cookie-driven personalisation additionally needs an explicitly designed first-party interest/identity flow and an agreed permission boundary; it is not supplied by GA4 or merely accepting the cookie banner.

The [agreed follow-up milestone](releases.md#personalised-follow-ups--next-release-2-milestone) keeps customer campaigns separate from operational staff outboxes. No outreach campaign, customer acknowledgement or subscriber enrolment was activated by the standalone Form test.

## Code pointers and audit boundary

- Intake gate: `src/lib/lead-intake/security.ts`; public journey: `src/app/(main)/register-interest/page.tsx`; durable endpoint: `src/app/api/leads/route.ts`.
- Atomic lead/consent/outbox persistence: `src/lib/lead-intake/persistence.ts`.
- Independent destination selection and flags: `src/lib/lead-delivery/runtime.ts`; Sheets configuration/adapter: `google-sheets-config.ts`, `google-sheets.ts` in the same directory.
- Staff-only Resend delivery: `src/lib/lead-delivery/resend.ts`, `resend-config.ts`; shared sender configuration: `src/lib/email/resend-settings.ts`.
- Worker packaging/schedule: `Dockerfile.worker`, `railway.worker.json`, `scripts/process-lead-deliveries.ts`.
- Analytics permission boundary: `src/components/analytics/consent-manager.tsx`, `src/lib/analytics.ts`; independent marketing wording and recording: `src/lib/lead-intake/contract.ts`, `persistence.ts`, `newsletter.ts`, `property-match.ts`.

This handoff is based on current repository code and the controlled Form receipt reported in this session. The source audit did not inspect secret values, run a worker, apply SQL, send mail, configure Railway or prove production website delivery. Older Power Automate-only rollout instructions are historical; use the current destination migration/configuration controls above for this activation.
