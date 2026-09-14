# Haus releases

## Release 1 — next to deploy

Branch: `suryak02/technical-seo-fixes`, [PR #15](https://github.com/deb-pradhan/Haus-Of-Estate/pull/15), reviewed against `main`.
Contains the technical SEO corrections and consented Google Analytics through
Google Tag Manager. `docs/release-1-analytics.md` defines the container setup,
event contract and verification steps. GA4 receipt remains pending company
GTM/GA4 access; a successful build or dataLayer event is not proof of collection.
Meta and advertising tags remain disabled.

## Release 2 — cumulative website overhaul

Branch: `suryak02/azizi-florence-content-scaffold`; PR #12.
This is the continuing branch for all feature work. It contains Release 1,
`product-demo-integration`, the complete Florence preparation and grouped
previews, and the September careers update. No new feature branch is needed.

Included features: newsletter/signup consent capture; contact-first enquiries;
login, recovery and bot protection; saved properties/articles; canonical sharing;
blog artwork corrections; inventory-driven country/city search; guarded AskHaus;
purchase-readiness information; editorial workflow; Florence; careers; and
the dedicated snagging inspection service and quote-enquiry page.
Keep backend-dependent feature flags subject to their existing service setup.

PR #12 targets Release 1 until Deb merges that release, then retargets `main`.
Use a merge commit for Release 1 to retain its ancestry; do not force-push or
rebase the shared feature history. Close superseded PRs only after their branch
tips are verified ancestors of Release 2 and the combined checks pass. Keep the
old branch refs as history rather than active development destinations.

Standalone Sanity is part of Release 2. The sibling Studio uses `jdxbkry4` /
`production` and imports the app's shared schemas without creating another
property model. See `docs/standalone-sanity-studio.md`. The embedded/legacy
Studio code is retained for compatibility; new local work uses the sibling.
The accepted Florence source documents and media retain their existing format.
Local preview records are not automatically imported or published.

On 14 September 2026, Surya explicitly authorised the Florence upload and
confirmed existing amenities. The six Florence entries and 22 prepared images
were imported into Sanity as native drafts, with present-tense copy. Existing
property documents were preserved. See `docs/florence-sanity-import-2026-09-14.md`.
Publication remains a separate action; drafts are visible in Studio rather
than the normal public property catalogue. Snagging is now available at
`/snagging`, linked from Services, desktop/mobile navigation and the footer.

Sonia's 14 September demo feedback is tracked in
`docs/sonia-demo-follow-ups-2026-09-14.md`: snagging education and Fatima's
article, confirmed calendar bookings (company calendar setup pending),
GBP/USD/AED display choices with dated indicative rates, and optional Zoho
transactional staff notifications. The image brief names Desire, Adifah and
Likith. Real appointment confirmation, email receipt and GA4 collection remain
separate verification steps after the relevant company services are connected.

## Personalised follow-ups — next Release 2 milestone

This milestone follows consolidation and local CMS setup on the same branch.
It is not part of Release 1 and is not yet a connected email-sending feature.
Define the detailed behaviour with Surya before implementation, then add
reviewable commits to Release 2. The agreed goal is consented email follow-up
with relevant existing articles and available properties based on visitors'
interests, including explicitly permitted AskHaus preferences.

Reuse accounts, separate newsletter/property-match consent records, saved
Sanity references and the assistant's structured preferences. Add a first-party
interest store and a separate customer-email queue using the existing worker's
lease/retry patterns. The staff lead-delivery outbox must continue to deliver
enquiries, not customer campaigns. GA4 is measurement, not a recipient database.

Before coding this milestone, settle recipient eligibility (verified accounts
or verified subscribers), send delay/frequency, article selection, reviewed
versus automatic sending, AskHaus preference confirmation, and retention.
Use server-recorded inactivity rather than assuming a closed browser can be
detected. Recheck consent, suppression and content availability at send time;
include unsubscribe and deduplication. Do not broaden historical opt-ins or
persist raw conversations silently. The first pilot must prove actual delivery
to designated test recipients, not mock transport success.

## Verification and remaining service access

- Record exact branch heads, ancestry checks, unit/browser results and builds
  in the two PRs. Preserve original commits and local handoff files.
- Exercise public search, Florence previews, saved items, lead forms, account
  routes, careers and consent behaviour on desktop/mobile.
- GA4: company account/container access and real DebugView/Realtime receipt pending.
- Sanity: the invited account is authenticated in the local Studio and CLI;
  six Florence drafts and their image references were verified after upload.
  App draft preview still needs its server token and appropriate CORS setup.
- Database, transactional email and staff delivery: verify configured services
  separately from API-intercepted browser tests. Newsletter preferences are
  recorded today; personalised campaign delivery is the next milestone.
- Production deployments, migrations, content publication and customer sending
  are separate from branch preparation. No production data migration is run by
  consolidating these branches or generating the Prisma client locally.
