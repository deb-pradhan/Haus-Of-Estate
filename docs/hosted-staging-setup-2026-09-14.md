# Hosted Release 2 test environment

Surya confirmed that the backend must run on a hosted test server before
production. Do not set up or connect a local PostgreSQL backend for this work.
Continue on `suryak02/azizi-florence-content-scaffold`; no new branch is needed.

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

Document validation returned **13 errors and zero warnings**: `availability`
and `listingType` are missing on all six; `unitType` is also missing on the
mixed community overview. This differs from schema-definition validation,
which checks whether the schema itself is valid. The uploaded documents are
prepared drafts, not completed publish-ready listings.

The user's sale intent is established. Confirm whether homes are ready,
off-plan or mixed before filling availability; existing amenities do not prove
home completion. Resolve how to represent the mixed overview without assigning
a misleading single-home classification. Native publication also requires the
existing content/SEO approval fields and workflow status. Do not invent those
approvals or change the live content simply to make drafts visible in a demo.

## Local setup cancellation

A new isolated local PostgreSQL cluster was briefly initialized before the
hosted-only correction. That new process was stopped; its generated files are
retained under `%LOCALAPPDATA%/HausOfEstate/postgres-release2-20260914/`.
No application database was created, no migrations or test records were applied,
and `.env.local` was not changed. The existing PostgreSQL service and the app
were untouched.
