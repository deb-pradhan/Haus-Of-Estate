# Haus releases

## Current work — 22 September 2026

Continue the same Release 2 branch and draft PR #16. The approved 22 September
website work prepares removal of the remaining Rent Smart Wales/Propertymark
claims, verified Companies House identity **17188168**, company blog bylines,
Sonia's team profile, the mortgage/EMI calculator and a public HTML sitemap with
published-only XML/HTML content. No production deployment or Sanity publication
was performed. The detailed completed/pending report and owners are in
[`website-update-2026-09-22.md`](website-update-2026-09-22.md).

Final checks passed: 408 unit tests, seven SEO/analytics checks, six desktop/mobile
consent tests and four careers policy/built-HTTP checks; production build,
TypeScript, focused lint and schema validation. Local content/structured-data
previews and calculator interactions were reviewed. These checks do not establish
hosted email delivery or actual GA4 receipt. The old cookie-policy URL now has a
verified 308 redirect to the current policy, prepared for the same release.

Sonia's new instruction supersedes the earlier careers browsing closure for
the **nine reviewed replacement roles**, including Social Media Account Manager
(Intern). Careers index/approved routes and navigation are prepared in R2;
retired/unknown job routes remain closed. Application intake is independently
disabled by default until hosted delivery is verified. Do not restore the old
role list or infer that browsing approval verifies an application pipeline.

Google checks at approximately 20:40–20:50 UK confirmed GA4 property **550966592**,
stream **15476606535**, **G-FEZF22MELJ**, still reporting no data in 48 hours.
Enhanced measurement and Signals are off. Ads personalisation was explicitly
saved from 307/307 to **0/307 allowed** under the authorised consent setup. GTM
accounts remain empty for Surya; supplied Google tag **GT-55K83XLJ** is not the
missing **GTM-…** container ID. Public HTML checked at 19:55 UK still supplied
`gtmId: undefined`. Deb's reported push to main needs to be reconciled with the
served deployment/environment; real receipt is not established.

Search Console access and the existing sitemap Success remain confirmed:
34 discovered pages, last read 18 September. Its dated Pages report shows
49 indexed/22 not indexed, requiring URL-level triage rather than a blanket
failure claim. Google Business Profile manager access now works; phone and
website match. Profile/Companies House say **Unit 1**, while the previously
approved website address is **Unit A**. Sonia/company owner must reconcile
the discrepancy; no address was changed.

The four May reports and reported 62/70 completion have not been independently
reconciled. Preserve the existing six-tab audit evidence and H21/H22 content
holds. The 22 September [Hafren hangar/garage source](https://www.hafrenproperties.co.uk/property/poa-large-commercial-hangar-garage-to-let-on-city-road-roath-cardiff-cf24-3bp/)
is now recorded; its identity must be reconciled with the earlier unspecified
warehouse before treating those requests as one. No customer campaigns, team
email or meeting invitations were sent.

## Historical work — 21 September 2026

**H01 now corrected live:** Surya's explicit instruction to remove the misleading
completed status was applied narrowly to published Al Furjan and Azizi Monaco
Mansions at 10:04:59 UTC. Public listing/home cards, both detail pages and their
description metadata were verified Off-plan at 10:06:25 UTC. Existing drafts and
all other property/blog content were preserved. This is a scoped CMS correction,
not a Release 2 deployment or permission to release held content. Receipt:
`docs/property-status-correction-2026-09-21.md`.

Continue the same Release 2 branch and draft PR #16 against main. A fresh remote
check began at R2 `f32b84d6` / main `20afdeeb`; there was no newer remote feature
work to reconcile. Existing uncommitted handoffs and local assets are preserved.
Do not reopen #12 or recreate the deleted SEO branch.

Social-bio follow-up: `/ask` is the short entry link to the existing standalone
`/enquire` form. It uses a 307 redirect and preserves platform query tags.
Next's config-routing checks, six SEO checks and focused lint passed; no full
build was repeated for this config-only follow-up. This is prepared in R2, not
a live link to promote: hosted enquiry, spreadsheet and email verification are
still pending. See `docs/social-lead-links.md` for marketing handoff wording.

H21 adds preparation of the three exact Cardiff commercial rental adverts and
an opt-in Haus photo-logo display layer. Warehouse identity remains missing;
it is excluded. See `docs/cardiff-commercial-preparation-2026-09-21.md` for
saved-draft/validation evidence and the source discrepancies to resolve before
publication. Existing H01/H08 drafts and paused Florence remain separate.

H05/H17 retain their verified-live 18 September status. GA4 still reports no data
and Surya's GTM list is still empty on 21 September. Request only the existing
container ID/Edit access, not another GA4/Search Console invitation. The lead
Google Sheet has already been received/read; decide Sheets versus Excel and
hosted/email ownership before integration.

All six tabs of Tanu's audit were read on 21 September. The recorded R1 homepage
LCP 2.3s / TBT 20ms pass remains valid for that one 18 September lab run; broader
content, sitemap, tracking and multi-page checks remain. Full status/owners are
in `docs/backlog-reconciliation-2026-09-17.md`; H16's new Angela/Filemail reference
is investigated separately in `docs/filemail-investigation-2026-09-21.md`.

## Historical release position — 18 September 2026

[PR #15](https://github.com/deb-pradhan/Haus-Of-Estate/pull/15) was merged into
`main` at `20afdeeb2b7c1de7ea46c67e9da8e8afbf8128fa`. GitHub records Railway
production deployment `6521282619` as successful at 09:20:32 UTC on 18 September
for that commit. The remote SEO branch is retired; do not recreate it.

Public checks at 22:27 UTC confirmed `/careers` and known/unknown job URLs return
404 with `noindex` and `no-store`; a harmless malformed application POST returned
the closed response. Desktop/mobile header, footer and About checks at 23:53 UK
found no recruitment links. Unit A and the Dubai business WhatsApp are live.
This verifies the urgent closure/contact release; it does not deploy Release 2.

At this checkpoint, `/careers`, job URLs and application intake were held closed
pending Sonia's approval. The 22 September approval above now prepares browsing
of the reviewed replacement list in R2; it does not retroactively change the
18 September live closure evidence. Preserve records/application history and
keep intake disabled until verified. The old role list remains superseded.

Release 2 continues on its existing branch in
[draft PR #16](https://github.com/deb-pradhan/Haus-Of-Estate/pull/16), targeting
`main`. Closed #12 retains the earlier review/history. Merge `3671f5a1` reconciles
the merged Release 1 ancestry without changing the tracked tree from `aeb8b613`.

Google access and the latest performance result are recorded below. Do not repeat
the old blanket request for GA4/Search Console invitations.

## Historical restart checkpoint — 15 September 2026

This is the saved state from 15 September, not the current release/access status.
The later sections and current release position above supersede it.

Surya requested saving work before restarting the PC. The Haus website, local
Studio and related project servers were stopped; checks of ports 3000, 3001,
3110, 3333 and 55432 found no listeners. Resume services only when requested.

- Continue on the existing Release 2 branch below. Preserve local uncommitted
  handoffs, `CLAUDE.md`, ignored environment files and local assets.
- The current backend recommendation and remaining implementation/access work
  are recorded in `docs/hosted-staging-setup-2026-09-14.md`. It is a plan, not a
  completed hosted deployment: Railway test environment plus its own PostgreSQL,
  existing Sanity, and a proposed shared Resend sender. Durable lead delivery
  still needs its Resend adapter; company hosting/email access remains pending.
- Florence work is explicitly paused. All six records remain Sanity drafts;
  public publication waits for Surya's discussion with Deb and Sonia. Do not
  change or publish the properties while resuming unrelated backend work.
- The only article-artwork pack to send is `artifacts/SEND-TO-DESIGNERS.zip`.
  It contains nine original covers, labelled previews and designer instructions.
  Older packs and working folders are archived under `artifacts/_archive/`.
  Contacts: Desire, Adifah and Likith; target 1920 × 1080, 16:9, full bleed.
- GA4/GTM IDs and access remain pending Sonia/Deb. The 15 September reminder
  was delivered. Do not add a second tracking snippet or claim real receipt.
- Main, production deployment, customer campaigns and Sanity publication remain
  separate from saving or resuming this work.

## Release 1 — merged and deployed

Historical branch: `suryak02/technical-seo-fixes` (remote retired).
[PR #15](https://github.com/deb-pradhan/Haus-Of-Estate/pull/15) is merged into `main`.
Contains the technical SEO corrections and consented Google Analytics through
Google Tag Manager. `docs/release-1-analytics.md` defines the container setup,
event contract and verification steps. GA4 is accessible, but GTM container
access/configuration and actual collection remain unverified; a successful build
or dataLayer event is not proof of collection.
Meta and advertising tags remain disabled.

## Release 2 — cumulative website overhaul

Branch: `suryak02/azizi-florence-content-scaffold`;
[draft PR #16](https://github.com/deb-pradhan/Haus-Of-Estate/pull/16) against `main`.
This is the continuing branch for all feature work. It contains Release 1,
`product-demo-integration`, the complete Florence preparation and grouped
previews, and the September careers update. No new feature branch is needed.

Included features: newsletter/signup consent capture; contact-first enquiries;
login, recovery and bot protection; saved properties/articles; canonical sharing;
blog artwork corrections; inventory-driven country/city search; guarded AskHaus;
purchase-readiness information; editorial workflow; Florence; retained careers
code under the public closure; and snagging education, FAQs and quote contact
links. A complete persisted snagging campaign-form journey remains unfinished.
Keep backend-dependent feature flags subject to their existing service setup.

PR #12 closed when its Release 1 base was retired. Reopening/base-change attempts
failed, so PR #16 replaces it on the same Release 2 branch and links its history.
Release 1's merge ancestry is retained; do not force-push or rebase the shared
feature history. Superseded feature PRs remain historical records, not active
development destinations. No replacement feature branch was created.

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

- Record current branch heads, ancestry checks, unit/browser results and builds
  in PR #16; PR #15 retains Release 1's evidence. Preserve original commits and
  local handoff files. Six SEO/analytics code checks passed again on 18 September.
- Exercise public search, Florence previews, saved items, lead forms, account
  routes, careers and consent behaviour on desktop/mobile.
- GA4: actual UI access to account `405511552`, property `550966592`
  (`www.hausofestate.com`) and Measurement ID `G-FEZF22MELJ` is confirmed.
  Property settings are editable, demonstrating editor-level settings capability;
  the exact assigned role label was not displayed. The UI reports no data received.
- GTM: Surya's container list is empty. Company container access/ID and the
  consented configuration still need resolving; this does not prove the company
  has no container. Do not add a duplicate tracking snippet.
- Search Console: access to domain property `hausofestate.com` works. Settings
  show non-owner access and the add-sitemap UI is available, consistent with Full
  capabilities; the exact role label was not shown. No new invitation is needed;
  confirm the role only if an operation requires it.
- Performance: the [official mobile homepage PageSpeed report](https://pagespeed.web.dev/analysis/https-hausofestate-com/low2lev69p?form_factor=mobile)
  from 18 September at 23:49 UK reports LCP **2.3 s**, TBT **20 ms**, Performance
  **98** and SEO **100**. This one lab run meets the homepage targets of LCP below
  2.5 s and TBT below 200 ms. Field data says **No Data**; other pages, repeatability,
  real-user performance and the broader SEO audit are not established by this run.
- Sanity: the invited account is authenticated in the local Studio and CLI;
  six Florence drafts and their image references were verified after upload.
  App draft preview still needs its server token and appropriate CORS setup.
- Database, transactional email and staff delivery: verify configured services
  separately from API-intercepted browser tests. Newsletter preferences are
  recorded today; personalised campaign delivery is the next milestone.
- The supplied lead Google Sheet `1VTc6AFWWBvm5RZP1t6WIEkdy1WsTFG9hI04s53j2EiE`
  has a completely empty `Sheet1`, with no values or headers. Whether it replaces
  the earlier Excel destination is awaiting Surya's answer. Do not assume either
  destination. No Google Sheets adapter is implemented; the current delivery
  choices remain Power Automate or ZeptoMail. First prove one hosted enquiry
  saved → `info@hausofestate.com` → agreed spreadsheet → customer receipt → reply.
  Hosted services, the chosen sender and customer receipt implementation remain
  outstanding; this is not a connected journey yet.
- Production deployments, migrations, content publication and customer sending
  are separate from branch preparation. No production data migration is run by
  consolidating these branches or generating the Prisma client locally.
