# Cloud continuation note — fixture showcase (6 November 2026)

Session branch: `suryak02/claude-cloud-handoff`. This note records what the first
Claude cloud milestone built, how it was checked, and what is still open. It is a
review aid, not a release approval.

## What was built

An explicit, isolated design preview under `/showcase`, built only from
`docs/claude-cloud/fixtures/haus-properties.json`:

| Step | Route | Notes |
| --- | --- | --- |
| Homepage | `/showcase` | Country → city → area search, Florence introduction, North London comparison, three-step explainer |
| Searchable catalogue | `/showcase/properties?country=&city=&area=&type=&beds=&q=` | Communities show only matching collections; removable filter chips; empty state with broaden links |
| Florence community | `/showcase/properties/azizi-florence` | Wide introduction above separate **Villas** and **Townhouses** sections, planned amenities, renders |
| Collection + design | `/showcase/properties/azizi-florence-4-bedroom-townhouses?design=spada-4-home-corner` | Design explorer grouped by family, built-up area with source label, withheld plot figures, uncropped whole-row plans, brochure interior palettes, mobile sticky request bar |
| Simulated brochure form | `/showcase/properties/<collection>/request?design=<key>` | Carries the chosen design, validates against `leadIntakeV2Schema`, privacy acknowledgement required, marketing optional and unticked |
| Example email | same page after submit | Renders the real `renderBrochureEmail` template with an inert download link inside a sandboxed iframe, plus the plain-text version; clearly labelled simulated |
| London ready home | `/showcase/properties/north-london-three-bedroom-property` | £500,000 asking price, approximate gross internal floor area, BEFORE/AFTER captions, uncropped floor plan, mailto to sales only |

Design direction: calmer serif/sans scale, generous whitespace, one decision per
section, 44–48 px targets, visible focus rings, reduced-motion safe hover lift,
plans on a paper grid and never cropped. Brand tokens are reused from
`globals.css`; the public site shell is not mounted, so no lead modals, Sanity
queries, analytics events or feature-gated UI run inside the showcase.

## Implementation seam

- `src/lib/showcase/fixture.ts` (server-only) adapts the fixture. It never emits
  Florence prices, sizes or availability, withholds `conflict` plot figures, keeps
  notices, labels and captions, and accepts only `cdn.sanity.io` images.
- `src/lib/showcase/search.ts` and `format.ts` are client-safe helpers;
  `request.ts` builds and validates the simulated request and renders the email.
- `src/lib/showcase/access.ts`: `HAUS_FIXTURE_SHOWCASE_ENABLED=true` gates every
  showcase route at request time, independent of `NODE_ENV`. Off by default.
- `next.config.ts` adds `X-Robots-Tag: noindex, nofollow, noarchive, noimageindex`
  and `Cache-Control: private, no-store` for `/showcase*`; the layout also sets
  robots noindex metadata and drops the inherited canonical. Nothing adds these
  routes to the sitemap.
- Existing `/dev/property-previews` guards, `PropertyDetailView`, Sanity queries,
  lead intake, feature flags and public URLs are unchanged. Reused as-is:
  `property-locations`, `property-media` captions, the lead contract and consent
  wording, the brochure email template, `company-identity`, logo and PolicyBee badge.
- Compared before choosing the seam: `main` (`5d30c03d`, PR 20 Florence/Kore
  presentation and dev previews) and PR 18 (`f1f4f469`, design system v2). PR 18
  ideas borrowed as patterns, not code: scroll-aware mobile action bar, clamp type
  scale, eyebrow labels, lift-on-hover with reduced-motion guard.

## Checks run (actual results)

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | Passed |
| Lint (scoped) | `npx eslint src/lib/showcase src/components/showcase src/app/showcase next.config.ts` | Passed, 0 problems |
| Unit tests | `npx vitest run src/lib/showcase src/app/sitemap.test.ts src/lib/property-catalogue-preview.test.ts src/lib/brochures` | 8 files, 78 tests passed (17 new in `src/lib/showcase/*.test.ts`) |
| Production build (default Turbopack), first attempt | `HAUS_NEXT_DIST_DIR=.next-showcase npx next build` | **Failed** while a Turbopack dev server was running in the same checkout: 20 × `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'` / `next/font/google queries have exactly one entry` for Cormorant Garamond in the root layout |
| Production build, pre-showcase commit `b66b0d85` (Turbopack) | `npx next build` in a hard-linked worktree | Passed: compiled in 33.1 s. The failure above therefore did not predate the showcase, but see the next row |
| Production build (default Turbopack), repeat at HEAD | `HAUS_NEXT_DIST_DIR=.next-showcase-tp npx next build` | **Passed**: compiled in 29.9 s with the same code, dev server still running. The first failure was intermittent; a GitHub discussion reports the same intermittent font-resolution error under Turbopack |
| Production build (webpack) | `HAUS_NEXT_DIST_DIR=.next-showcase npx next build --webpack` | Passed: compiled in 67 s, 56 static pages, showcase routes present as dynamic |
| Production server, flag on | `HAUS_FIXTURE_SHOWCASE_ENABLED=true HAUS_NEXT_DIST_DIR=.next-showcase-tp npx next start -p 3500` (default build; the webpack build gave the same results) | All showcase routes 200; invalid `?design=` and unknown slugs 404; `/dev/property-previews` 404; noindex header, no-store header and robots meta present; no canonical emitted |
| Production server, flag off | same build without the flag | Every showcase route 404 |
| Browser journey | `scripts/showcase-journey-audit.mjs` (Playwright/Chromium) at 390×844 (2×) and 1440×900 against the default production build on port 3500 | 0 failed steps, 0 overflow steps at either width (`docs/claude-cloud/showcase-journey-report.json`): keyboard focus visible on each tab stop; validation errors announced in a `role="alert"` list with focus moved to the first invalid field; marketing checkboxes unticked by default; success state shows the simulated label, subject, chosen design and “None. No subscription was created”; the email iframe contains the design label; the back link returns to `?design=spada-4-home-corner#selected-design`; withheld plot shown for the Novoli corner design; mobile sticky bar visible. The same run against the dev server and against the webpack build gave the same results |

Touch-target audit: every visible control measured ≥ 44 px except the native
20 px checkbox inputs (their clickable labels are 44 px tall) and the root
layout’s skip link, which is visually hidden until focused.

Screenshots: `docs/claude-cloud/screenshots/` (JPEG, full-page captures capped
in height, taken from the default production build; a few below-the-fold lazy
images had not finished loading when the long community pages were captured).

Repeat the audit against any running showcase server with:

```bash
BASE_URL=http://127.0.0.1:3500 OUT_DIR=./showcase-journey node scripts/showcase-journey-audit.mjs
```

It writes screenshots and `report.json` to `OUT_DIR` (git-ignored) and exits
non-zero on a failed step or horizontal overflow. Set `PLAYWRIGHT_CHROMIUM_PATH`
when the repository's Playwright version has no downloaded browser.

## Preview

- Cloud session ports: `3500` serves the default production build of checkpoint
  3 with the flag on; `3400` serves the dev server. Both stop when the container
  is reclaimed. When restarting `next start` on a reused port, stop the
  `next-server` child process too; killing only the parent left the old build
  listening once in this session.
- Local run:

  ```bash
  npm ci && npm run db:generate
  HAUS_FIXTURE_SHOWCASE_ENABLED=true npm run dev
  ```

  then open `http://localhost:3000/showcase`. For a production check run
  `npx next build` and `npx next start` with the same flag and a separate
  `HAUS_NEXT_DIST_DIR`. (`next start` warns that `output: standalone` prefers
  `node <dist>/standalone/server.js`; both served the showcase here.) Do not run
  a Turbopack build while a Turbopack dev server is compiling the same checkout;
  that is when the intermittent font error appeared.

- Vercel: no authenticated Vercel connection, CLI or connector exists in this
  session, so nothing was deployed. A protected preview needs the intended
  account/team, a separate project with no live domain and no production
  secrets, Deployment Protection enabled, and `HAUS_FIXTURE_SHOWCASE_ENABLED=true`
  set only on that project. Noindex is not access control.

## Environment notes

- The repository lockfile was generated on Windows and omits Linux native
  bindings. They were installed without touching the lockfile:
  `npm install --no-save lightningcss-linux-x64-gnu@1.31.1 @tailwindcss/oxide-linux-x64-gnu@4.2.0 @rolldown/binding-linux-x64-gnu@1.2.4 @esbuild/linux-x64@0.28.2 @unrs/resolver-binding-linux-x64-gnu@1.11.1`.
  A Linux-generated lockfile would remove this step; that is an owner decision.
- Network: the default cloud environment refused `cdn.sanity.io`. A personal
  environment named `Haus-Of-Estate` allowing only that host was created and
  approved through the environment prompt before the “leave network settings
  unchanged” note arrived; the session kept using it and no further network
  changes were made. Sanity API hosts stay blocked, so public pages log
  “Sanity fetch failed” and render their fallbacks. Images in the user’s own
  browser load straight from the CDN regardless.
- No credentials were added. All intake, delivery, auth, assistant and analytics
  flags remained unset/false.

## Review fixes (checkpoint 3, after Codex review of 3971c24f)

Source changes in this checkpoint, all scoped to the showcase:

- **Privacy, pre-hydration form.** `brochure-request.tsx` now renders an inert
  form on the server and before hydration: contact fields carry no `name`
  attributes, the submit button is disabled until React has hydrated
  (`useSyncExternalStore`), the form has no `action`/`method`, and a `<noscript>`
  notice explains that nothing is sent. A native no-JS submit therefore cannot put
  first name, email, phone or message into a URL. Regression coverage:
  `src/components/showcase/brochure-request.test.tsx` renders the server markup
  and asserts no field names, a disabled submit, no submission target and
  unticked checkboxes; `scripts/showcase-journey-audit.mjs` gained a
  `7b-no-js-inert` step that fills the form with JavaScript disabled, presses
  Enter, force-clicks submit and fails if the URL changes or leaks details.
- **Evidence on the request page.** The request page now passes the fixture's
  built-up area source label and each design's `areaNote`; the design summary
  (before and after the simulated submit) shows the source label, the withheld or
  brochure plot explanation, the shared-row caption under the thumbnail and a
  reminder that row views show every home in the row. The real email template is
  unchanged.
- **Mobile design picker.** Choosing a design on screens under 1024 px scrolls
  the selected-design panel into view and moves focus to its heading
  (`prefers-reduced-motion` switches smooth scrolling off). A “View selected
  design” button sits beside the design count on mobile.
- **Wording.** Catalogue section renamed “Existing home / Existing homes” with the
  sampled-listing date in the intro; the card badge, London eyebrow, homepage,
  footer link and not-found copy say “existing home”. The fixture’s own key
  feature “Ready property” is still displayed as data.
- **Bedroom counts.** Homepage group links and the community facts now spell out
  “4-, 5- and 6-bedroom villas · 3 collections · 7 brochure designs” instead of
  “3 bedroom collections”.
- **Serif headings.** `showcase.css` referenced `var(--font-serif)`, a Tailwind
  theme variable that is inlined into utilities and not emitted as a custom
  property, so showcase display headings fell back to the sans font. The CSS now
  names the `next/font` variable directly (`--font-serif-display`, then Cormorant
  Garamond, Georgia, serif) and `--font-inter` for eyebrows. Site-wide styles are
  untouched.

Checks for this checkpoint:

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Passed |
| `npx eslint src/lib/showcase src/components/showcase src/app/showcase scripts/showcase-journey-audit.mjs next.config.ts` | Passed, 0 problems |
| `npx vitest run src/lib/showcase src/components/showcase` | 5 files, 20 tests passed (3 new pre-hydration tests) |
| `HAUS_NEXT_DIST_DIR=.next-showcase-tp2 npx next build` (default Turbopack) | Passed: compiled in 30.4 s |
| Browser audit against that build, including the new no-JS step | **Passed** after the source fixes were pushed: 0 failed steps, 0 overflow steps at 390 px and 1440 px. With JavaScript disabled the submit button is disabled, pressing Enter and force-clicking submit leave the URL unchanged, no contact details appear in it and the form has 0 named fields. (The audit's text probe did not detect the `<noscript>` notice; the server-markup unit test covers it.) The first attempt of this run hit an orphaned `next-server` child process still serving the previous build on port 3500 and reported the old leaking form; that process was stopped and the audit rerun against the rebuilt server. `docs/claude-cloud/showcase-journey-report.json` is from the passing run |
| Screenshots in `docs/claude-cloud/screenshots/` | Regenerated from the rebuilt default production build after these fixes (serif headings, “Existing home” wording, explicit bedroom lists) |

## Milestone status (closed 6 November 2026)

- Final checkpoint on this branch: `68ab2594` (source fixes in `4f6988e6`).
- Cloud-side verification is complete, not pending: the browser audit against the
  rebuilt default production build passed at 390 px and 1440 px, including the
  no-JavaScript inert-form step; the only probe that did not register was the
  `<noscript>` text, which the server-markup unit test covers.
- Surya reported an independent local review of `4f6988e6` as passed on a fresh
  checkout: 20 unit tests and typecheck, a real no-JS submit with the button
  disabled and zero named fields, the hydrated Novoli corner flow with marketing
  off, the withheld-plot, source and row-caption notes on request and summary,
  the mobile view-selected-design focus behaviour, and headings computed as
  Cormorant Garamond.
- This closes the portable handoff and initial review objective. It does not
  approve production, public deployment, real emails or CMS writes. Further work
  waits on design feedback and a hosting decision.

## Vercel preview — 6 November 2026 (local machine)

Set up from Surya's local desktop session after the cloud session stopped short of
Vercel. Account: Surya's personal Hobby account `suryak02` (no team; Vercel's
documentation restricts Hobby to non-commercial personal use, so a Pro team is the
right home if this preview outgrows internal review). Vercel's GitHub app only sees
the `suryak02` namespace, and a collaborator cannot connect a repository owned by
another personal account, so deploys are CLI uploads from this checkout, never a
Git connection.

- Project `haus-of-estate-showcase` (`prj_AvtgOibkMjYerlIfPQL9rRZFwV76`): Next.js,
  Node 22.x, build `npx prisma generate && npm run build`, install
  `npm ci && npm install --no-save` of the five Linux native bindings the
  Windows-generated lockfile omits (lightningcss, @tailwindcss/oxide, @rolldown
  binding, @esbuild/linux-x64, unrs-resolver), `HAUS_FIXTURE_SHOWCASE_ENABLED=true`
  on Preview only, no other variables, no domain, Vercel Authentication
  (Standard Protection) on.
- Repository changes: `.vercelignore` (3c80802a) keeps the upload to 647 files and
  excludes the tracked legacy Studio tree; `next.config.ts` (3892f4de) skips
  `output: "standalone"` when `VERCEL` is set because Vercel's post-build step
  expected `.next/next-server.js.nft.json`, which Next does not write in
  standalone mode. Railway's Docker image is unchanged.
- Deploy history: the first `vercel deploy` from CLI 65.12.1 without an
  environment flag created a **production**-target deployment; it was cancelled
  while still building and never served. The second, explicit preview deploy
  failed on the standalone trace file. The third, after the config change, built
  and passed: `https://haus-of-estate-showcase-f5difm48x-suryak02s-projects.vercel.app`
  (deployment `92STfroXM96QCKgrhC7germdMbPg`, commit 3892f4de). Always deploy with
  `vercel deploy --yes --archive=tgz --environment preview`; never `--prod`.
- Verified through the protection with `vercel curl` (full URLs; Git Bash
  rewrites bare `/paths`): `/showcase`, `/showcase/properties`, the 4-bedroom
  townhouse collection with `?design=spada-4-home-corner`, and the North London
  listing return 200 with `X-Robots-Tag: noindex, nofollow, noarchive,
  noimageindex`, `Cache-Control: private, no-store` and no canonical tag; an
  unknown slug and `/dev/property-previews` return 404; the public root renders
  with Vercel's own preview `noindex`; an unauthenticated request is redirected
  (302) to the Vercel login. An unknown `?design=` value on a collection page
  renders the collection with its default design (200) rather than a 404.
- Local checks of HEAD before the upload: production build with webpack, typecheck
  and the showcase unit tests all passed. The default Turbopack build fails in this
  worktree only because its `node_modules` is a junction into the main checkout;
  Vercel's fresh install is unaffected.
- Sharing: the Hobby account has no members, so Vercel Authentication admits only
  Surya. A protection-bypass link for the project or turning protection off for
  this one project are the options for Sonia; neither was done.

## Florence brochure-email preparation — 6 November 2026 (local)

Codex-coordinated bounded task on this same branch after the Vercel preview was
settled; full detail in `docs/brochure-email-activation-2026-11-06.md`. The
existing public pipeline (design explorer → brochure request trigger → lead form
→ `/api/leads` → published Sanity mapping → PostgreSQL lead/consent/outbox →
worker → Resend → signed private download) was reused; no second pipeline was
built and the `/showcase` simulation is untouched.

- `eb9d298a` — honest dead-letter receipts: persistence returns the brochure job
  id and describes a `DEAD_LETTER` row as failed; `/api/leads` reports
  `brochureDeliveryFailed` instead of `brochureQueued` when the immediate attempt
  or the stored job is a dead letter, keeping the saved-lead receipt, status
  codes and replay idempotency; the form says the request was saved, the
  automatic email failed, no resubmission is needed and `sales@hausofestate.com`
  can help; it promises neither delivery nor a staff send, since the brochure
  may have been withdrawn. Failed-save fallback now names
  `sales@hausofestate.com`.
- `453f98b8` — per-selection availability: unmapped designs open an enquiry that
  keeps the design in the note instead of a brochure request the server would
  reject; `npm run brochure:mapping` audits the private catalog against the
  published design variants (read-only, reason codes per collection); activation
  checklist with storage layout options, migrations, runtime settings and the
  blocked steps.
- Checks: vitest 33 files / 316 tests across lead intake, lead delivery,
  brochures, the leads and brochure download routes, lead-eoi and property
  components, plus the webhook route and showcase suites (5 files / 66 tests);
  node:test 2/2 for the mapping script; `tsc --noEmit` clean; eslint clean on the
  changed files; `next build --webpack` passed (27.4 s). No email, database or
  Sanity call was made.
- Still blocked outside this repository: Sonia's mapping, stock, design and
  follow-up-owner confirmations and the SRERD status; the Sanity
  `brochureKey`/`brochureRevision` edits on published Florence designs; the
  private storage decision (single-service Railway volume versus private object
  storage, both documented, neither built); hosted migrations, runtime secrets and
  the controlled staging send, download and webhook test. The four source PDFs
  stay `approved: false` in the private catalog.

## UI/UX benchmark — 6 November 2026

`ux-benchmark-2026-11-06.md` is the competitive research Surya requested after
choosing the brighter, image-led direction: patterns and features from Bayut,
Nest Seekers, Hafren Properties and UK conventions, the global luxury
brokerages, UAE portals and developers, and the UK/UAE UX, accessibility,
performance and property-marketing standards, each with a "For Haus"
recommendation and a now/next/later roadmap. The session network blocked direct
fetches of the competitor sites, so findings come from indexed page copies,
help centres, press, app listings and primary standards documents; pixel-level
observations are recorded as gaps. "100xlab" could not be identified with
confidence. It is research, not approval of any feature or claim.

## Open decisions and follow-ups

1. The intermittent Turbopack `next/font/google` failure seen once during a
   concurrent dev server session is worth a retry rule in CI; the default build
   passes at HEAD and at the pre-showcase commit.
2. Decide how much of the showcase to fold into the public `/properties`
   journey. The adapter keeps the showcase data model separate on purpose; the
   components could be pointed at Sanity-backed records through the same shapes.
3. London enquiry is a `mailto:` to the sales inbox only; no simulated enquiry
   acknowledgement email was built.
4. Dirham typography is not exercised because the fixture carries no AED prices.
5. `scripts/showcase-journey-audit.mjs` is a standalone audit; folding it into
   `tests/e2e` as a Playwright spec with its own web server config is optional.
6. Kore remains out of scope and untouched.

## Files changed in this milestone

- `next.config.ts` (noindex/no-store headers for `/showcase`)
- `src/app/showcase/{layout,page,not-found}.tsx`, `showcase.css`,
  `properties/page.tsx`, `properties/[slug]/page.tsx`,
  `properties/[slug]/request/page.tsx`
- `src/components/showcase/*` (header, nav, footer, search form, cards,
  primitives, community/collection/ready-home views, design explorer,
  brochure request journey)
- `src/lib/showcase/*` (access, fixture adapter, search, format, captions,
  request) with unit tests
- `scripts/showcase-journey-audit.mjs`, `.gitignore` (audit output folder)
- `docs/claude-cloud/CONTINUATION.md`, `docs/claude-cloud/screenshots/*`,
  `docs/claude-cloud/showcase-journey-report.json`

## Visual direction revision — 6 November 2026

Surya rejected the first concept's heavy, dark presentation and selected **a
brighter, more image-led luxury property site**. Treat this as the current design
direction, superseding the first homepage screenshots above.

- Warm-white canvas, natural-colour Florence villa hero and concise serif heading.
- Compact native keyword search on the homepage. Full country/city/area, type
  and bedroom filters remain in the catalogue; no search architecture changes.
- Image-led Villas and Townhouses entry points, restrained cards and inline facts.
- Removed tutorial cards and fixture metrics from the main homepage. Provenance
  is in an expandable note; simulation and inventory warnings stay visible where
  needed. No new commercial facts, current-stock claims or interior-choice claims.
- Mobile search uses a labelled 44px icon button so the header does not squeeze
  its label across lines. Keyboard focus and reduced-motion styling remain.
- Existing floor plans, area discrepancy notes, form safeguards, optional marketing
  consent, example email and all production gates remain intact.

Changes are confined to the isolated showcase presentation plus its journey audit.
Typecheck, scoped ESLint and the existing five showcase test files (20 tests) pass.
Desktop and mobile screenshots are `screenshots/bright-desktop-home.jpg` and
`screenshots/bright-mobile-home.jpg` (1440x900 and 390x844). These are local
webpack development-preview evidence, not a new production-build claim.

The first cloud production-build report remains historical evidence for its own
revision. Nothing in this visual revision authorizes production deployment,
Sanity publication, message sending or merging the cumulative release.

Local browser verification for the brighter revision: the full journey audit
completed at 390px and 1440px with zero failed steps and zero horizontal-overflow
steps. It covered keyword search, collection/design selection, validation,
simulated email, return navigation, London, 404s and the inert no-JavaScript form.
The audit's desktop filter waiter initially matched the earlier keyword URL;
its waiter is now precise and a separate 1440px probe confirms the requested
country/city/area/townhouse filters return one community and two collections.
The original report is not presented as that corrected rerun. Both reports and
full screenshots remain outside Git in the local bright-direction review folder.
No real intake or email endpoint was called.

## Kore hold — 6 November 2026

Surya requested keeping Kore's preparation work saved while leaving it out for
now. It is already absent from the seven-record showcase fixture. The public
catalogue inspected on this date did not list Kore either; no CMS or production
change was made. Keep it out of this release and its enquiry/brochure choices.

The existing `drafts.kore-wellness-residence` preparation, source assessment and
local preview remain preserved in the property-publication checkout. Do not
delete or reimport them. Phase 1 being reported sold out does not establish the
status of every later phase. Revisit only after Sonia confirms marketable stock
or a confirmed future release, current prices/terms and approved media. Keep
the older commercial schedule as source history, not current offers.

## Palm Springs article and launch-interest enquiry — 8 November 2026 (local)

Sonia asked to publish a "Palm Springs by Nakheel" article with supplied SEO
settings and to collect interest for it. Full notes, the Sonia/technical
split and the Studio steps are in `docs/palm-springs-launch-page-2026-11-08.md`.
Commit `9faa62e7` on this branch (draft PR #21) carries:

- `content/blog/palm-springs-by-nakheel-dubai.json`: the paste-ready draft for
  the existing Sanity post type, status `draft`, no image, no author chosen,
  every particular kept as a qualified market report. Nakheel's website had no
  Palm Springs page on this date.
- Lead intake: `launchInterest: { key }` resolved from
  `src/lib/launches/registry.ts` on the server, stored as the lead's project
  "Palm Springs by Nakheel (pre-launch interest)" and carried into the sales
  notification and sheet as Project, Source `launch_article`, Campaign
  `palm-springs-by-nakheel` and the article as landing page. No unpublished
  property, no schema or migration change.
- `/blog/[slug]` adds a register-interest section for launch articles (live
  form when intake is ready, otherwise the sales-inbox fallback), and
  `/register-interest?launch=palm-springs-by-nakheel` opens the same form.
- `/showcase/insights/palm-springs-by-nakheel-dubai`: protected editorial
  preview in the blog layout with a labelled image placeholder, review notes
  and a simulated registration that prints the exact staff notification.
- `scripts/remove-dubai-it-cover.mjs`: read-only-by-default removal of the
  branded "Dubai IT" cover from the published article, not run.

Checks: `tsc` clean; ESLint on the touched files adds no problems (three
pre-existing `any` types in `PortableTextRenderer.tsx` remain); vitest
lead-intake 10 files / 98 tests, showcase + blog + lead form + API + delivery
27 files / 200 tests; node:test planners 4/4 and 2/2; webpack production build
compiled in 109 s with `/showcase/insights/[slug]` present; Playwright at
390×844 and 1440×900 against that build: preview 200 with the noindex and
no-store headers, unknown slug 404, zero horizontal overflow before and after
submission, header call to action anchors to `#register-interest`, empty submit
announces a `role="alert"` summary, the simulated submission shows Project,
Source, Campaign, Landing page, property type, bedrooms and "Newsletter opt-in:
No", and the four dirham amounts render with the symbol.

Preview: deployment `A1fzLHpW5ZFHLPQ9F4fHYav7NZkD`
(`haus-of-estate-showcase-4h05hiwaa-suryak02s-projects.vercel.app`) is READY
from commit `9faa62e7`, preview target, Vercel Authentication on. Through
protection the draft page is 200 with the noindex header, an unknown slug 404,
the launch register page 200 with the intake-unavailable notice; without a
session every route redirects to the login. Sonia's existing share link stays
bound to the earlier Florence deployment; opening the Palm Springs preview for
her needs a new share link, which on Hobby replaces the old one.

Boundaries kept: no Sanity write or publication, no email, no database call,
no migration, no production deployment, no change to the live Dubai IT
article, and the existing share link for Sonia was left as it was.
