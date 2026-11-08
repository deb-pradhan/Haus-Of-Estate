# Palm Springs article and launch interest enquiry — 8 November 2026

Sonia supplied an article, SEO settings and a reference launch page for
"Palm Springs by Nakheel" and asked to collect interest for it. This note
records what was prepared on `suryak02/claude-cloud-handoff` (draft PR #21),
how it fits the existing Sanity post workflow and lead pipeline, what was
checked, and what still needs a decision. Only the publishable draft copy and
implementation notes live in the repository; the source emails do not.

## A. Ready in code

### 1. The article, in the existing post workflow

- `content/blog/palm-springs-by-nakheel-dubai.json` is the paste-ready draft
  for the existing Sanity `post` type: title, subtitle, slug
  `palm-springs-by-nakheel-dubai`, status `draft`, SEO title and meta
  description exactly as supplied, categories `dubai` and `market-insights`,
  and a Portable Text body using only the block styles, marks and link
  annotation the schema already allows. No image, no author reference and no
  new schema fields. The file also lists the supplied keyword guidance (not a
  meta-keyword system) and the review flags below.
- Every particular from the source copy is kept as a report, not a fact:
  prices "indicative and should not be treated as official developer prices";
  event, information and booking dates "subject to confirmation by Nakheel";
  the formal EOI deposit "must be confirmed with the developer before any
  payment is made". A status line records that Nakheel's website had no Palm
  Springs page on 8 November 2026 (checked directly; the pages a search engine
  returned were all brokers). Registering interest with Haus of Estate is
  described as not a developer EOI: no payment, no reservation, no priority.
- Amounts written "AED 3.8 million" in any article now render with the
  existing dirham symbol component. `PortableTextRenderer` swaps the ISO code
  for the symbol only when a number follows, at render time; stored content
  keeps the plain text and nothing is inferred for amounts without it.

### 2. Project-attributed register-interest, through the existing pipeline

- `src/lib/launches/registry.ts` is a code allowlist of developer launches.
  It holds Palm Springs with its reported unit types and bedroom counts as
  form options, a qualification sentence, and the article slug. It stores no
  prices, dates or availability.
- The lead contract gains an optional `launchInterest: { key }` (strict,
  kebab-case) and the surface `launch_article`. A launch cannot be combined
  with a published property, a brochure, a sale brief or a newsletter-only
  registration. Normalisation carries the key for every interest and includes
  it in the idempotency hash.
- The service resolves the key from the registry on the server
  (`src/lib/lead-intake/launch.ts`). It never queries Sanity for it and an
  unknown key is a `launchInterest` field error, not a silent general enquiry.
  The launch is stored as the lead's project: `projectSlug`
  `palm-springs-by-nakheel`, `projectTitle` "Palm Springs by Nakheel
  (pre-launch interest)", `projectCommunity` "Jebel Ali, Dubai". No
  unpublished property record exists or is needed.
- The sales notification and sheet row carry `Project`, `Source`
  (`launch_article` unless a UTM source is present), `Campaign` (defaults to
  the launch key when no UTM campaign is present), `Landing page` (the article
  path) and the buyer's property type, bedrooms, timeframe and message.
  `src/lib/lead-delivery/notification-text.ts` now holds the notification text
  builder the Resend transport uses, so previews show the exact email. The
  staff notification keeps the customer as reply-to; follow-up goes from the
  sales inbox, as agreed.
- `LeadEoiForm` accepts `launchInterest`. It shows a "Launch interest" panel
  with the qualification, defaults the interest to buy, prefills only the
  place (United Arab Emirates, Jebel Ali), hides sale and newsletter-only
  options, offers the launch's reported home types (Townhouse, Villa) and
  bedroom counts (3, 4, 5) labelled "reported options" instead of the generic
  lists, drops the bathroom field, and sends `launchInterest` instead of
  `project`. The simulated showcase form uses the same options and label.
  Marketing consent stays optional, separate and unticked.
- `/register-interest?launch=palm-springs-by-nakheel` renders that form with a
  launch-specific heading. Unknown keys fall back to the ordinary page.
- `/blog/[slug]` recognises a launch article by slug and adds a call to action
  under the header plus a `#register-interest` section after the body. With
  lead intake ready the section embeds the live form (surface
  `launch_article`, landing page = article). With intake off it shows the
  agreed fallback instead of a dead form: email `sales@hausofestate.com` with
  the project in the subject, WhatsApp, and a link to the register page.

### 3. Editorial preview, protected and simulated

- `/showcase/insights/palm-springs-by-nakheel-dubai` renders the draft in the
  blog layout from the JSON above (`src/lib/showcase/articles.ts`), behind the
  existing `HAUS_FIXTURE_SHOWCASE_ENABLED` gate, noindex and no-store headers,
  and Vercel Authentication on the preview project. The page shows a clearly
  labelled "Approved project image pending" placeholder where the hero would
  be, the draft status and preparation date, an editorial sidebar with the
  slug, SEO title, meta description, keyword guidance, source and the review
  flags, and in-article register links rewritten to the page's own section.
- The register-interest section there uses `LaunchRegisterSimulated`
  (`src/lib/showcase/launch-request.ts`): the same fields and consent wording
  as the live form, validated against the native contract with the launch key,
  then the exact sales notification the team would receive is shown on the
  page. Nothing is saved, sent or subscribed, and the page says so before and
  after submission. `/showcase` is the shared entry point: a "Start here"
  block links to the Florence community journey and to the Palm Springs
  draft, and the navigation carries both.

### 4. Dubai IT cover removal, prepared

Sonia's request of 5 November 2026 ("Please Remove Image ASAP", with a
screenshot of the branded cover) is received and recorded here; it is not
re-opened as a question for her. Verified on 8 November 2026 against the
published Sanity record and the live page: the article `from-palm-jumeirah-to-difc-how-rapid-execution-powers-dubai-property-growth`
(`aef74ca4-762a-4e73-ae9e-99d540439167`) still carries `featuredImage`
`image-d779c361dcdb87ff32a4eb6208c2bbe6be2accd1-1920x1080-png`, uploaded on
5 November 2026 at 18:07 UTC as `dubai-it-canva-original-2026-11-05.png`, alt
"Dubai skyline at dusk with Haus of Estate and Dubai IT branding". The live
page serves it as the hero and as the Open Graph image, and the article is the
featured card on `/blog`. The earlier "Dubai IT (1).png" asset (1048 × 700,
29 October) is referenced by nothing. Only this post references the branded
asset.

Two narrow paths, neither run yet; the production change stays unexecuted until Surya or Deb runs one:

1. **Studio (preferred, no code), in today's production editor:** Posts →
   open the article → clear the Featured image field → Publish. Status, body
   and SEO stay as they are.
2. **Script for Deb or Surya with a Sanity token:**
   `npx sanity exec scripts/remove-dubai-it-cover.mjs --with-user-token`
   prints the plan only. `HAUS_DUBAI_IT_COVER_EXECUTE=true` unsets
   `featuredImage` on the published document, and on its native draft only if
   the draft carries the same asset, with revision guards, a backup under
   `.git/dubai-it-cover-removal-2026-11-08/`, a read-back that nothing else
   changed, and a check that no other post or property revision moved.
   `scripts/lib/cover-removal-plan.mjs` holds the tested planning rules.

Effect either way: the article renders without a hero, the featured and
related cards show an empty frame, Open Graph falls back to the site default
image, and the article's JSON-LD drops its image. No replacement image is
guessed. The asset stays in the media library until someone deletes it
separately.

## B. Deployment and integration still needed

- **What is live today.** `hausofestate.com` is served from Railway and shows
  the features of `main` at `5d30c03d` (PR #20 merged on top of PR #17): the
  dirham symbol on the home and properties pages, the North London listing
  with its BEFORE/AFTER captions and the PolicyBee badge, checked on 8 November
  2026. It is not Release 1. The launch section, the register-interest
  `?launch=` parameter, the dirham rendering in article text and the Palm
  Springs preview are not on `main`, so none of it is live.
- **PR #21 conflicts with `main`.** `main` carries seven commits this branch
  lacks (PR #17 `128715a5` and PR #20 `5d30c03d`, 55 files, 30 of which this
  branch also changed). `git merge-tree --write-tree origin/main HEAD` reports
  21 conflicting files, none of them Palm Springs lead-intake or showcase
  files:
  `src/app/(main)/blog/[slug]/page.tsx`,
  `src/app/(main)/legal/privacy-policy/page.tsx`,
  `src/app/(main)/properties/[slug]/page.tsx`,
  `src/app/(main)/renovations/page.tsx`, `src/app/(main)/services/page.tsx`,
  `src/components/blog/AuthorCard.tsx`, `src/components/blog/BlogCard.tsx`,
  `src/components/blog/FeaturedPost.tsx`,
  `src/components/landing/property-showcase.tsx`,
  `src/components/layout/footer.tsx`,
  `src/components/properties/PropertyDesignExplorer.tsx` (add/add),
  `src/components/properties/PropertyDetailView.tsx` (add/add),
  `src/components/properties/property-development.tsx` (add/add),
  `src/components/properties/property-listing.tsx`,
  `src/lib/blog-thumbnail.ts` (add/add), `src/lib/property-designs.ts`
  (add/add), `src/lib/property-developments.ts` (add/add),
  `src/lib/property-media.ts` (add/add), `src/lib/property-taxonomy.ts`
  (add/add), `src/sanity/queries.ts`, `src/sanity/schemaTypes/property.ts`.
  The eight add/add files were created independently on both sides; `main`'s
  copies are the deployed ones.
- **Smallest safe integration path, not attempted.** (1) Deb confirms that
  `main`'s versions of the eight add/add property and blog files are
  canonical, since they are what production runs. (2) Merge `origin/main`
  into this branch as one reviewable commit: take `main` for those eight,
  reconcile the other thirteen by hand (the Palm Springs work touches only
  `src/app/(main)/blog/[slug]/page.tsx` among them, a two-import, two-line
  addition that reapplies cleanly), and keep this branch's lead-intake,
  showcase and docs untouched. (3) Rerun the property, blog, lead-intake and
  showcase suites and a production build before the PR leaves draft. A rebase,
  or taking either side wholesale, is not safe because both sides changed the
  Florence design and detail components. If Palm Springs is wanted before the
  whole branch, commits `9faa62e7` and `f30ec924` cherry-pick onto a
  `main`-based branch with the same single blog-page conflict, but that is a
  new branch and needs Surya's explicit instruction.
- Lead intake stays off until `LEAD_INTAKE_ENABLED`, `DATABASE_URL` and
  `LEAD_RATE_LIMIT_SECRET` are set on the delivery host and the pending
  migrations have been applied there. Until then the article shows the
  sales-inbox fallback, not a form.
- Sales notification delivery needs `LEAD_DELIVERY_ENABLED`,
  `LEAD_NOTIFICATIONS_ENABLED`, the Resend sender and `LEAD_NOTIFICATION_TO`
  (`sales@hausofestate.com`). The sheet export needs its header row to match;
  no new columns were added.
- Execute the Dubai IT cover removal Sonia requested on 5 November 2026
  ("Please Remove Image ASAP"). The request is received and recorded; it waits
  only for someone with Studio or token access to run path 1 or 2 in section
  A.4. No replacement image is chosen. Sonia does not need to decide again.
- No migration, schema or Studio deployment is required for the article or
  the launch form. Creating the draft in Sanity is an editorial step (Studio,
  or a token-holding import from the JSON) and was not performed.

## C. Sonia must confirm

- The official particulars once Nakheel publishes them: launch and booking
  dates, prices, unit mix, payment plan, EOI deposit and refund terms, and the
  precise location. Until then the article keeps every figure as a report.
- Approved Palm Springs media: a 1920 × 1080 cover with alt text, and whether
  a brochure may be offered. No image was supplied; Florence and Palm Jebel
  Ali renders and the reference site's assets are not used.
- The contact details in the copy: the draft names `sales@hausofestate.com`
  (the agreed follow-up address) where the supplied text had
  `info@hausofestate.com`, plus the published UK number and UAE WhatsApp
  number. Confirm or revert.
- The SEO title promises "Prices"; the body gives indicative figures only.
  Keep or soften.
- The author to attribute in Studio (the public byline reads Haus of Estate)
  and the named owner who follows up launch registrations from the sales
  inbox.

## D. Creating the draft in Studio

Two different editors must not be confused.

- **Today's production Studio** at `hausofestate.com/studio` is built from
  `main` at `5d30c03d`. Posts → All Posts → Create. Title, slug and author are
  required; alt text is required only when an image is supplied; the post
  becomes publicly queryable when Status is Published and the native Publish
  action is used. There is no editorial-approval checklist in this editor.
  This is the Studio Sonia uses now and the draft JSON is the source to paste
  from, section by section: title, slug `palm-springs-by-nakheel-dubai`,
  subtitle, body, author, categories Dubai and Market Insights, SEO title and
  SEO description. Her account's permissions were not tested.
- **The unreleased branch** (this PR) adds an `editorialApproval` object and
  a guard that disables native Publish until content and SEO approval, an
  approver and a date are recorded with Status `published`. Those fields do
  not exist in the production editor until the Studio is redeployed from the
  reviewed schema. Do not give Sonia instructions that mention them yet.

In either editor: leave Featured image empty until an approved image exists,
and keep Status at draft until the review flags are settled.

## E. Checks run on 8 November 2026

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | Passed |
| Lint, touched files | `npx eslint …` over the launch, lead-intake, showcase, blog, register and script files | 0 new problems. The three pre-existing `any` types in `PortableTextRenderer.tsx` remain. |
| Lead intake suites | `npx vitest run src/lib/lead-intake` | 10 files, 98 tests passed, including the new contract, normalisation, service and persistence launch cases |
| Showcase, blog, lead form, API, delivery, launches | `npx vitest run src/lib/showcase src/components/blog src/components/lead-eoi src/app/api/leads src/lib/lead-delivery src/lib/launches tests/unit/careers-pages.test.tsx src/app/sitemap.test.ts` | 27 files, 200 tests passed |
| Script planners | `node --test scripts/lib/cover-removal-plan.test.mjs`; `node --import tsx --test scripts/check-brochure-mapping.test.mjs` | 4/4 and 2/2 passed |
| Production build | `HAUS_FIXTURE_SHOWCASE_ENABLED=true npx next build --webpack` | Compiled in 109 s; `/showcase/insights/[slug]` and `/register-interest` present as dynamic routes |
| Browser flow | Playwright at 390 × 844 and 1440 × 900 against that build on port 3500 | Preview 200 with noindex and no-store headers; unknown slug 404; zero horizontal overflow before and after submission; header call to action anchors to `#register-interest`; empty submit announces a `role="alert"` summary; the simulated submission shows Project, Source, Campaign, Landing page, property type, bedrooms and "Newsletter opt-in: No"; four dirham amounts render with the symbol |
| Protected preview | `vercel deploy --yes --archive=tgz --environment preview` from commit `9faa62e7`, deployment `A1fzLHpW5ZFHLPQ9F4fHYav7NZkD` (`haus-of-estate-showcase-4h05hiwaa-suryak02s-projects.vercel.app`) | READY, preview target, commit metadata `9faa62e7`. Through protection: the draft page 200 with the noindex header and placeholder copy, unknown slug 404, `/register-interest?launch=…` 200 showing the intake-unavailable notice, `/showcase` 200. Without a session every route redirects to the Vercel login. The earlier deployment started from the uncommitted tree was cancelled because its metadata named `f566bf14`. Sonia's existing share link is bound to the previous deployment and does not open this one; a new share link is a separate decision because a Hobby account holds one at a time |

Not done, by design: no Sanity write, no email, no database call, no
migration, no production deployment, no change to the live Dubai IT article.
