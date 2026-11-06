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
