# Hosted Release 2 test environment

Surya confirmed that the backend must run on a hosted test server before
production. Do not set up or connect a local PostgreSQL backend for this work.
Continue on `suryak02/azizi-florence-content-scaffold`; no new branch is needed.

## Current backend plan

Use this document as the current backend plan. Earlier readiness notes are
historical snapshots, including any recommendation to create a local database.
Surya requested this consolidation on 14 September because the distinction
between implemented backend code and connected services kept becoming unclear.

Recommended first milestone: one hosted Release 2 test website with real account
verification, durable enquiries, staff email receipt and saved items. Hosting
and email choices below are recommendations for Deb to confirm, not evidence
that services have been provisioned or a spending commitment has been made.

| Responsibility | Recommended service | Current state |
| --- | --- | --- |
| Website and server APIs | Existing Next.js app on the company Railway project | Application and Docker deployment configuration exist; a separate test target and access are not established. |
| Accounts, saved references, enquiries, consent and pending deliveries | Separate PostgreSQL database in the Railway test environment, using the existing Prisma models | Implemented in code; real hosted persistence and migrations still need verification. Sanity remains the property/article source. |
| Editorial content | Existing hosted Sanity project and standalone Studio | Connected. Florence remains untouched as unpublished drafts following Surya's explicit pause. |
| Automatic website emails | One company-owned Resend account for account, careers and staff enquiry messages | Accounts/careers already use Resend. Durable enquiry delivery needs a Resend adapter and provider-selection support; only Power Automate and ZeptoMail are supported today. |
| Reliable staff enquiry retries | Existing PostgreSQL outbox plus the Railway five-minute worker | Implementation and deployment files exist; the worker and actual inbox delivery have not been verified on a hosted test environment. |
| Staff inboxes and human replies | Company's existing mailbox provider; Zoho Mail if Haus adopts Deb's suggestion | Exact lead and careers recipients and mailbox ownership need confirmation. This does not replace the database or automatic sender. |

Keep Resend as the recommended automated sender because it is already used by
accounts and careers. Add the missing lead adapter behind the existing outbox
instead of introducing a second mandatory sending provider. Preserve the other
adapters as available options; do not switch a live provider or queued events
without inspecting the actual environment first. If Haus already has an approved
and functioning transactional sender, assess that existing service before
creating a duplicate company account. Zoho Mail and ZeptoMail are different
services; Zoho's current guidance assigns application-generated emails to a
transactional sender, and newsletters to a campaign service.

### Work that remains in the code

- Add the Resend transport to durable lead delivery, with provider acceptance,
  idempotency where supported, failure/retry coverage and explicit configuration.
- Review account and careers failure/recovery behaviour: those paths send
  directly and do not currently share the lead outbox's durable retry guarantees.
  Verify that a failed sender never masquerades as successful inbox delivery.
- Finish newsletter/provider synchronisation, public unsubscribe and suppression
  handling in the next milestone. Consent-recording functions already exist;
  complete newsletter delivery and personalised follow-ups do not.
- Define personalised interest capture, inactivity rules, recommendation inputs,
  frequency limits and withdrawal behaviour before implementing follow-up jobs.
  The staff-delivery worker is not an implemented customer follow-up scheduler.

These are distinct from the hosting/account configuration required below.
Confirmed snagging bookings also remain a separate integration: the website has
a booking-page/widget connection, but the team calendar and booking rules have
not been set up. GA4 account setup is separate from the application database.
Neither calendar nor newsletter setup needs to block the first backend milestone.

### One request to Deb and Sonia

Deb needs to confirm the company Railway project, provide named project access,
identify or approve an isolated test environment with its own PostgreSQL service,
and confirm the resource budget and person responsible for database maintenance.
The repository points to the existing production Railway project, but its live
configuration has not been inspected. Do not infer that production has no backend.

The email owner needs to confirm whether Haus already owns a Resend account or
another transactional service, and arrange sender-domain verification through the
DNS owner. Sonia needs to name the actual monitored lead and careers recipients.
Use a designated team test mailbox first. `info@hausofestate.com` is published on
the site; a marketing-specific recipient has not been verified. Store credentials
in the hosting service, not in this document or chat.

Suggested message, not sent:

> Deb, can we use the existing company Railway project for a separate Release 2
> test website, with its own PostgreSQL database, and give me project access?
> The website already has the backend code. I recommend keeping Resend for
> automatic website emails and connecting those to the team's existing inboxes.
> Please confirm whether we already have a transactional email account, who can
> verify its sending domain, and the test-hosting budget. Sonia, please confirm
> which inbox should receive property enquiries and which should receive careers
> applications. We can then prove the complete account, saved-item and enquiry
> journeys on the test website before a separate production decision.

### Execution order and completion evidence

1. Confirm the exact Railway project/environment and create or select its test
   web service, PostgreSQL service and scheduled delivery worker. The web service
   uses the existing Release 2 branch. Check its database reference explicitly;
   environment duplication can copy variables and external connections.
2. Configure test-only secrets, an HTTPS test URL, sender settings and a designated
   recipient. Review the actual database and migration history. A verified empty
   test database can run the full seven-migration set currently in the repository.
   Existing databases require baseline/history checks. Generate approval from the
   actual pending names and checksums; do not reuse an older single-migration
   example from a historical note.
3. Complete and verify the chosen email adapter before enabling delivery. Build
   and deploy the web and worker services, then verify they use the same test
   database and compatible sender settings.
4. Demonstrate registration, an actually received verification email, login,
   saving an existing published item, sign-out/sign-in persistence and password
   reset. Verify application state in PostgreSQL as well as the browser.
5. Demonstrate one enquiry persisted with consent and an outbox event, actual
   staff inbox receipt and a reply route. Simulate a failed provider attempt,
   recover it via the worker, and inspect retries/duplicates rather than relying
   on an API success response alone. Use designated test accounts and recipients.
6. Record the test URL, tested commit, migration state, successful journeys and
   remaining failures here. Configure backup/restore and error visibility with
   a named owner before relying on the service. Railway's PostgreSQL template is
   hosted but is described by Railway as unmanaged; maintenance is a company
   responsibility.

No hosting resources, credentials, database migrations, email sends, content
changes or deployments were performed for this planning update. Florence work
remains paused. Earlier statements that a preview is possible describe the
implementation capability, not a completed hosted setup.

References: [Railway environments](https://docs.railway.com/environments),
[Railway PostgreSQL](https://docs.railway.com/guides/postgresql),
[Resend sender-domain verification](https://resend.com/docs/dashboard/domains/introduction),
[Zoho Mail and transactional email](https://www.zoho.com/mail/help/adminconsole/transactional-email-integration.html).

## Hosting evidence and next dependency

The repository already supplies `railway.json`, `Dockerfile` and the optional
five-minute delivery worker configuration. GitHub deployment records identify
[the existing Railway project](https://railway.com/project/5d7a0e8a-221c-4de1-9a8e-1444f02fe22d?environmentId=e19864e5-1f3d-46c4-9a7d-5c901e1e446e).
The recorded environment is **production**, not a confirmed test target. Both
historical GitHub environment names resolve to that same project/environment.
No usable Railway CLI credentials or authenticated browser access were found.

Obtain access to that company project and identify its test environment, or
create one there once the company confirms the target and resource allocation.
The test environment should have its own database and secrets, use the Release 2
branch, and provide a stable HTTPS URL for the team. Do not reuse the production
database or send test messages to customer lists.

Set the public site URL, Sanity project and dataset in the web service before
building. The Dockerfile now declares their public build arguments because
Next.js embeds them into browser bundles. Keep database, authentication and
mail credentials in server runtime variables, never public build arguments.
An existing image must be rebuilt for a different public URL or dataset.

Use a separate Sanity test dataset for publication rehearsals. Alternatively,
authenticated preview can read the existing production drafts without publishing
them; confirm the selected content workflow when the test target is available.
A server read token now suffices for Sanity's signed preview entry. A separate
Viewer-only browser token is optional for standalone live draft updates. Never
put an editor/personal CLI token into the browser token setting.

Before relying on the hosted environment, verify its actual database identity
and migration state, then apply the exact reviewed migrations. A new empty test
database can run the full set. Verify durable enquiries, registration and real
verification/reset emails, authenticated saved items, staff delivery/retries,
and Sanity preview/publication isolation. Calendar booking and analytics still
require their company accounts. Production deployment remains separate.

Focused preview/property checks passed: 11 tests, changed-source ESLint and
TypeScript. Draft catalogues now identify unpublished content and hide saving
and the published-content assistant during review. No hosted deployment,
database migration or Docker image build was performed in this update.

Sources: [Railway environments](https://docs.railway.com/environments),
[Railway Docker build variables](https://docs.railway.com/builds/dockerfiles).

## Florence content audit

Authenticated reads on 14 September confirmed all six native drafts in
`jdxbkry4/production`. Heroes and every gallery reference resolve. The five
home types contain the supplied AED starting amounts/ranges. There are no
Florence documents in the published perspective.

The initial document audit returned **13 errors and zero warnings**: missing
`availability` and `listingType` on all six, plus `unitType` on the mixed overview.
Document validation checks saved records; schema-definition validation checks
the schema itself. These were different checks and should not be conflated.

Surya subsequently confirmed **off-plan**, with sale intent already established.
All six actual Sanity drafts now have `availability: ["off-plan"]` and
`listingType: ["sale"]`. The mixed overview has `unitType: "Development"`, an
additive schema option that avoids calling an entire mixed community one Villa.
The five home types retain their existing Villa/Townhouse classifications.
Fresh-revision-guarded transactions and exact before/after comparisons confirmed
prices, images, copy and all other fields were preserved. Audit receipts are in
`.git/florence-sanity-classification-2026-09-14/`.

Final validation of the six actual amended records returned **zero errors and
zero warnings**. Twelve focused taxonomy/assistant/editorial checks, lint and
TypeScript also passed after adding the Development option.

Native publication still requires the existing content/SEO approval fields and
workflow status. All six remain drafts; no approval or publication was invented.
Historical preparation/import bundles remain snapshots of their original inputs;
the amended Sanity records are the current content source.

## Local setup cancellation

A new isolated local PostgreSQL cluster was briefly initialized before the
hosted-only correction. That new process was stopped; its generated files are
retained under `%LOCALAPPDATA%/HausOfEstate/postgres-release2-20260914/`.
No application database was created, no migrations or test records were applied,
and `.env.local` was not changed. The existing PostgreSQL service and the app
were untouched.
