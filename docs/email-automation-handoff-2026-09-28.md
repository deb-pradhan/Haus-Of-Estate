# Deb: email activation and automation — 28 September 2026

**Reuse the existing website/Resend integration.** Deb's immediate work is company sender/DNS access, hosting secrets and the delivery worker. The website staff notification code already exists; customer enquiry acknowledgements and consented campaigns still need application work. None of these require enabling login or AskHaus.

This extends [the Release 2 deployment handoff](deb-release-2-handoff-2026-09-28.md) and [the exact lead activation checklist](lead-activation-handoff-2026-09-28.md). Continue draft PR #16 on the existing cumulative branch. This is a setup/build handoff, not evidence that any hosted email integration is operational.

## Four different capabilities

| Capability | Current implementation | What activates it |
| --- | --- | --- |
| Interim Google Form → Sheet | Published Form and controlled Sheet receipt verified; independent of Railway | Share [the existing Form](https://forms.gle/7fwMEN83ySQoMhps8); answers enter **Form responses 1** |
| Google Forms alerts / response copies | Native new-response alerts enabled for Surya; response copies enabled as `When requested`, verified after reload | Each company editor enables their own alerts; verify actual alert/copy receipt separately |
| Website → staff notification | Durable notification outbox, Resend transport and scheduled worker exist | Deb configures the existing database, sender, recipient and worker; Sonia verifies staff inbox arrival |
| Website → customer acknowledgement / marketing | Enquiry acknowledgement, customer queue, public unsubscribe journey and provider-event processing are not implemented | Surya/implementing developer adds the work below; Deb deploys/configures it after review |

Careers already has a separate recruiter notification and applicant confirmation. Keep `CAREERS_INTAKE_ENABLED=false` until that endpoint's hosted recruiter/applicant delivery is verified; it is not the enquiry acknowledgement system.

## Google Form: useful immediately, separate from the website backend

In the [Form editor](https://docs.google.com/forms/d/1WdLU-4qdset6PUR6oWt-03Lk3gxstfrBXS2ExBrrEEo/edit), **Settings → Responses → Send responders a copy of their response** was set to `When requested` on 28 September and verified after reload. **Responder input** email collection was preserved, which does not require Google sign-in. **Responses → More → Get email notifications for new responses** was enabled for Surya, with its checked state verified. The person using `info@hausofestate.com` must open the Form while signed in to that account and enable their own new-response notifications; this cannot be configured for them from Surya's session. No add-on is needed. [Google instructions](https://support.google.com/docs/answer/139706?hl=en-GB).

These are Google notifications/copies, not branded Haus replies or subscription consent. Do not import ordinary Form enquiries into a newsletter list. The current Form has no newsletter/property-match opt-in questions. No test submission or email was sent in this settings follow-up; actual inbox receipt remains unverified.

Surya currently owns the Form and `info@hausofestate.com` is an editor. Google does not permit transferring a personal-account file directly into a work/school account. If the company account is Google Workspace, its user can make a company-owned Form copy and link it to the existing Sheet using a new response tab; review Form and Sheet permissions separately. Keep the old Form and public link working until the company-owned copy has a tested submission/notification and the replacement link is ready to share. Copying changes the responder link; do not claim that ownership handover is already complete. [Google ownership restrictions](https://support.google.com/drive/answer/2494892?hl=en).

## Deb / company administrators: smallest practical setup

1. **Use one authorised company email provider.** Reuse Haus's Resend account if it exists; company ownership/billing, sender verification and API access are currently unverified. Invite the necessary developer/admin rather than sharing a personal mailbox password. If Haus already operates ZeptoMail or Power Automate, the existing staff adapters can use it; confirm that provider's suitability before choosing it for later campaigns.
2. **Authenticate the sender domain.** The DNS administrator adds exactly the sending records supplied by the chosen provider (SPF/DKIM and any required return-path records), preserves existing mailbox MX/SPF configuration and reviews DMARC alignment/policy. Verify the domain in the provider dashboard and check authentication on a real received test. Do not invent DNS values or replace the company's inbound-mail setup. [Resend domain setup](https://resend.com/docs/add-a-domain), [DMARC guidance](https://resend.com/docs/dashboard/domains/dmarc).
3. **Agree sender and reply handling.** Sonia supplies one monitored staff destination and the customer-facing reply inbox. Current `RESEND_FROM_EMAIL` accepts a bare address ending exactly `@hausofestate.com`; a sending subdomain would need an explicit validation change. The fallback `noreply@hausofestate.com` is not evidence of verified sending. Existing staff mail replies to the validated enquirer's address. A monitored Reply-To on future customer emails must be implemented; there is no existing customer Reply-To environment switch.
4. **Configure the existing service, not a second form backend.** Use the server-only variables below, the database migration gate and the dedicated Sheet tab in the lead activation checklist. Store credentials in Railway secrets, never Git, browser code or public build arguments. Deb can do this without granting Surya Railway access.
5. **Run the existing worker.** Use `railway.worker.json` / `Dockerfile.worker` from the reviewed app revision: `node dist/process-lead-deliveries.cjs`, scheduled every five minutes. Stop the old worker before deploying destination-aware queue code. Review pending historical jobs before enabling delivery. Monitor failed/dead-letter jobs and pending age; do not equate provider acceptance with inbox receipt.
6. **Prepare later customer-delivery operations.** Once the new code defines its webhook endpoint and secret configuration, Deb registers that deployed HTTPS endpoint with the provider and stores its signing secret. Do not configure an invented route or environment flag now. Assign an operator to sender failures, suppression and the campaign stop control.

### Existing configuration names only

| Setting | Minimum intended location / value |
| --- | --- |
| `DATABASE_URL` | Verified shared PostgreSQL connection on web and worker |
| `LEAD_RATE_LIMIT_SECRET` | Strong production secret on web |
| `LEAD_INTAKE_ENABLED` | Web `true` only for controlled acceptance / verified activation; worker `false` |
| `LEAD_DELIVERY_ENABLED` | Web `false` for save-only intake; worker `true` after preparation |
| `LEAD_DELIVERY_PROVIDER` | Worker `resend` if selected; omitted value defaults to legacy `powerautomate` |
| `RESEND_API_KEY` | Worker key authorised for the verified company sender; also web only when careers is activated |
| `RESEND_FROM_EMAIL` | Worker bare approved `@hausofestate.com` sender; same rule for careers web service |
| `LEAD_NOTIFICATION_TO` | Worker: one approved, monitored `@hausofestate.com` staff inbox |
| `LEAD_SHEETS_ENABLED` | Worker `true` after Sheets setup; web `false` in this minimal setup |
| `LEAD_SHEETS_SPREADSHEET_ID`, `LEAD_SHEETS_TAB_NAME`, `LEAD_GOOGLE_SERVICE_ACCOUNT_JSON` | Worker only: approved Sheet, dedicated website tab and company service-account credentials; see linked checklist |
| `CAREERS_INTAKE_ENABLED`, `CAREERS_EMAIL` | Separate web careers gate and approved recruiter inbox; keep gate off until verified |
| `AUTH_ENABLED`, `SAVED_CONTENT_ENABLED`, `PROPERTY_ASSISTANT_ENABLED` | Remain `false` |

The gated migration process uses a temporary, exact reviewed `HAUS_DATABASE_MIGRATIONS_APPROVED` value; follow the existing checklist rather than copying a historical value. There is no campaign-enable flag, marketing worker or provider-mail webhook endpoint to turn on yet. Missing notification credentials are not a supported Sheets-only mode: the current worker queues staff notification failures independently of successful Sheet delivery.

## Application work: Surya / implementing developer

1. **Customer enquiry acknowledgement:** add a separate durable, idempotent action after the enquiry transaction succeeds. Reuse the selected provider transport/configuration pattern, but send an approved acknowledgement to the enquirer, with a monitored company Reply-To and no marketing additions. Keep recipient/lead data escaped and minimal; never claim human review or a response deadline without an agreed commitment. Retry without resending the staff notification or Sheet row.
2. **Subscriber journey:** preserve the existing independent newsletter and property-match choices, wording/version/time evidence and withdrawal helpers. Add address-confirmation/eligibility handling for the pilot and a public, token-based unsubscribe/preferences journey that does not require login. Allow withdrawal of one purpose or all marketing without affecting ordinary enquiry handling.
3. **Separate customer queue/scheduler:** define explicit message purpose, subscriber/campaign identity, uniqueness, due time, attempt state and provider message ID. Apply current consent, global suppression and per-purpose eligibility immediately before every send/retry, not just when queued. Add an operator pause control, rate/frequency limits and a bounded scheduler; the existing five-minute staff/Sheet worker does not generate campaigns.
4. **Delivery events and suppression:** implement a provider webhook using the raw request body, signature/timestamp validation and event-ID deduplication. Persist delivery/failure outcomes; suppress hard bounces and complaints and prevent subsequent marketing. Reject forged events and make duplicates/out-of-order events harmless. Respect provider suppression as well as local withdrawal. [Resend signature verification](https://resend.com/docs/webhooks/verify-webhooks-requests).
5. **Campaign content:** render approved templates from eligible published content only, include functioning unsubscribe links and applicable list-unsubscribe headers, and store which content was sent. Avoid invented property details. Keep opens/click tracking off for the initial pilot unless its purpose/permission and reporting are explicitly designed.
6. **Google Form boundary:** native Form answers currently go only to the Sheet. Adding branded acknowledgements for those answers would require an explicit integration with deduplication and ownership, separate from enabling Google response copies. Do not build a parallel Apps Script email system merely to duplicate the website transport.

Cookies do not supply an email address or subscribe someone. First-party browsing-based personalisation is additional work with an explicit identity/permission design; an initial opted-in subscriber pilot can operate without it, accounts or AskHaus.

## Sonia: one consolidated set of business decisions

Provide the monitored staff/reply inboxes, acknowledgement wording, owner of lead follow-up, permitted campaign audiences, approved content, first sequence/timing, maximum frequency and retention policy. Keep an acknowledgement limited to the submitted enquiry. Confirm who maintains company Google/provider access. These choices can be supplied once alongside Deb's infrastructure setup; they are not new approvals for every code change.

## Proof to return before calling each part operational

- **Native Form:** one authorised test response reaches the existing Sheet, and any enabled editor alert/response copy actually arrives at the intended test inbox. An enabled setting alone is not receipt. The earlier `HAUS-FORM-CHECK-20260928` row proves Sheet capture only.
- **Website staff flow:** record deployed revision, reviewed migration set, one saved Lead, independent notification/Sheet events, one Sheet row and actual staff inbox receipt. Repeat/retry without duplication; inspect failure recovery and reply handling.
- **Customer acknowledgement:** one real authorised test inbox receives the correct sender, reply address and message; repeat submission/worker retry does not send another copy. Record provider ID and authentication results without publishing customer details.
- **Campaign pilot:** only designated opted-in test recipients; withdrawal before send and between queue/retry prevents delivery. Test signed/forged/replayed events, bounce/complaint suppression, scheduler pause and deduplication. Confirm actual receipt and a working unsubscribe before any customer campaign.

**Remaining blockers:** company provider/DNS authority and verified sender/key; hosted database/worker/Google credentials; monitored company inbox and owner; the unbuilt acknowledgement/campaign lifecycle above; controlled end-to-end receipts. Current code audit: `src/lib/lead-delivery/{resend,resend-config,runtime}.ts`, `src/lib/email/resend-settings.ts`, `src/lib/lead-intake/{persistence,newsletter,property-match}.ts`, `src/lib/email/resend.ts`, `railway.worker.json`. No application code, DNS, hosting, campaigns or outgoing mail is changed by this document.
