# SEO verification — 16 September 2026

The prepared release contains useful technical SEO and measurement work. It is
not evidence that the whole external SEO audit is complete, that production has
changed, or that search rankings, traffic or enquiries have improved.

## Evidence and release state

- Reviewed the actual `origin/main...suryak02/technical-seo-fixes` diff, its four
  commits, the current cumulative Release 2 files, local handoffs, Surya's
  email-derived backlog (H12/H13), and the fetched original audit text.
- GitHub read-only check: [PR #15](https://github.com/deb-pradhan/Haus-Of-Estate/pull/15)
  is **OPEN and DRAFT**, targets `main`, and reports merge state `CLEAN`.
  Its status-check list is empty. `CLEAN` concerns mergeability, not approval,
  passing CI, deployment or acceptance of the audit.
- Release 1 head: `e0e762ab4c895d5c30333069c2ad03b14c18dc5c`.
- Remote `main`, independently checked through GitHub, matches local
  `origin/main`: `4b953091c30af44c2dcd660b224397938278b924`.
- Current Release 2: `suryak02/azizi-florence-content-scaffold`, head
  `52153317b67e62cd4842b93d1481129a0b887ad5`. Release 1 is an ancestor
  (`git merge-base --is-ancestor` returned 0).
- No branch switch, website edit, build, server start, browser run, deployment,
  CMS publication, GTM publication or message to another person was performed.
  This report is the only file added by this verification.

The four Release 1 commits are `37fe8e00` (technical SEO/homepage performance),
`8c23ab55` (review links/error handling), `ea7953fd` (consented analytics) and
`e0e762ab` (analytics verification and explicit demo hosts).

## What changed and why it helps

The file references below identify current Release 2 locations. Attribution to
Release 1 comes from the Git diff, rather than assuming every existing SEO
facility was newly added in that release.

| Change established by the Release 1 diff | Practical benefit | Evidence and limit |
| --- | --- | --- |
| Added a permanent redirect from every `www.hausofestate.com` path to its equivalent `https://hausofestate.com` path. | Gives visitors and crawlers one preferred hostname and reduces duplicate-host ambiguity. | `next.config.ts:7–15`; `tests/technical-seo.test.mjs:6`. Installed Next.js documentation says `permanent: true` produces **308**, not specifically 301. Live redirect/DNS/TLS behavior was not checked. |
| Converted the homepage and static hero shell to Server Components, fetching featured properties, FAQs and testimonials on the server instead of after browser hydration. Kept interaction in smaller client components. | Content and internal property links no longer depend on a browser-side CMS request after page load; less homepage code needs client hydration. | `src/app/(main)/page.tsx:1`, `src/components/landing/buy-rent-sell.tsx:1`, `homepage-faq.tsx:7`, `homepage-reviews.tsx:96`, `property-showcase.tsx:147`. This is implementation evidence, not a fresh rendered-HTML or crawl test. |
| Added `revalidate = 60` and made homepage CMS calls throw on errors rather than treating errors as empty data. | Supports cached content refresh and avoids silently turning a failed CMS response into an apparently valid empty homepage section. Where ISR applies, an unsuccessful revalidation can retain the last successful cached result. | `src/app/(main)/page.tsx:21`; homepage calls use `throwOnError: true`. R1 helper was in `src/sanity/client.ts`; R2 carries it in `src/sanity/live.ts:20–39`. No failure-injection/cache test was run today. |
| Deferred modal code and phone input, isolated property search, added below-the-fold `contentVisibility`/estimated sizing, supplied responsive image `sizes`, and removed several homepage JavaScript reveal/count-up dependencies. | Reduces initial browser work and lets the browser defer offscreen rendering or choose a more appropriate image size. | `src/components/lead-modal/modal-context.tsx:18`, `src/components/services/services-toggle.tsx:28`, `src/app/(main)/page.tsx:211`, `src/components/landing/property-showcase.tsx:83`. No new bundle-size, Lighthouse or Core Web Vitals comparison was measured. |
| Removed the Trustpilot destination and generic Google-search review link, and changed the review-section heading/copy that implied Google verification. | Removes misleading or unapproved outbound review destinations and the associated attribution. | Release 1 diff and `src/components/landing/reviews-carousel.tsx`; source regression test at `tests/technical-seo.test.mjs:20`. This is not proof of a verified review profile or verified testimonial data. |
| Replaced the unconditional optional GTM loader with an explicit analytics-consent boundary, allowed public-host/path rules, sanitized event payloads and withdrawal controls. | Prepares controlled measurement of public visits and intent after consent, so later changes can be evaluated without sending contact details or raw search/chat/form data in the application events. | `src/app/layout.tsx:161`, `src/components/analytics/consent-manager.tsx:11`, `src/lib/analytics.ts`, `docs/release-1-analytics.md`. Actual GTM/GA4 configuration and receipt remain pending company access. Analytics itself does not establish a ranking improvement. |
| Changed homepage search from a claimed lead submission to `haus_property_search`, with results navigation and truthful status copy. | Prevents search activity from being counted as a successfully received enquiry. | `src/components/landing/homepage-property-search.tsx`; event contract in `docs/release-1-analytics.md:26–36`. R2 separately defines successful intake events in `docs/release-2-analytics.md`. |

The homepage changes should improve the technical conditions for discovery and
user experience. Any quantified performance, traffic, ranking or conversion
benefit remains a measurement target, rather than an observed result here.

## Existing facilities that this release did not introduce

The main-branch baseline already contained default titles/descriptions,
canonical metadata, Open Graph/Twitter metadata and Organization/RealEstateAgent/
WebSite JSON-LD in `src/app/layout.tsx`. Release 1 did not rewrite those values.
`src/app/sitemap.ts`, `src/app/robots.ts` and `src/lib/seo.ts` have no Release 1
diff. Their existence must not be presented as newly completed audit work or as
proof that every URL has correct metadata, schema or indexability.

Release 2 contains further features and changed shared rendering dependencies,
including restoring account/tooltip providers for those features. A historical
Release 1 performance result cannot automatically describe the current
cumulative Release 2 bundle.

## Comparison with the original audit

Source: [SEO-Audit report-Haus_of_estate](https://docs.google.com/document/d/1BmDdxoRd6S6FFVqgozcCso-ta7XTPxvUHoLaBnD0IIY/edit?tab=t.wf82xwwh9rtz),
fetched on 16 September and retained locally at
`.git/seo-audit-source-2026-09-16.txt`. The retrieved text includes the Priority 1
list, Priority 2 discussion dated 18 August, technical issues, Tanu's About-page
social-link requirements, the thin-content URL list, and the 1 September
hreflang specification. Screenshot contents were not independently remeasured.
The repeated numbering in Priority 1 is preserved by referring to each topic
instead of inventing new original item numbers.

**Acceptance verdict: partially addressed, not complete.** Some requirements
are already implemented in `main`, some are prepared in Release 1 or 2, and
several require content, external-account or live-performance evidence.
"Implemented" below means source evidence exists; it does not mean deployed.

### Priority 1 and technical issues

| Exact audit recommendation / acceptance target | Status on available evidence | Implementation and outstanding acceptance evidence |
| --- | --- | --- |
| Core Web Vitals/rendering/image blocking on every page; improve mobile LCP and Speed Index. Technical tab reports **LCP 3.0 s**, target **<2.5 s**, and **TBT 310 ms**, target **<200 ms**. | **Partial implementation; numerical targets unverified.** | Release 1 server rendering, deferred code, image `sizes` and offscreen rendering address relevant causes on the homepage. No fresh LCP/TBT/Speed Index measurement, all-page audit or same-condition before/after result was run. The source gives no numeric Speed Index target. TBT is the audit's lab metric, not a substitute for field Core Web Vitals. |
| Trustpilot homepage button returns 404. | **Implemented in Release 1 by removal; live acceptance unverified.** | The unapproved Trustpilot link was removed, rather than replaced with a verified profile. `reviews-carousel.tsx` source test passes. Confirm the broken button is absent after deployment; verify ownership/destination before any future replacement. |
| Both `www` and non-`www` return 200; specifically request **301** from `www.hausofestate.com` to `hausofestate.com`. | **Permanent canonical redirect implemented; exact status criterion differs.** | `next.config.ts:7–15` uses `permanent: true`, which installed Next.js documentation specifies as **308**. This serves the permanent canonical-host objective, but it is not the audit's literal 301 requirement. Agree acceptance of 308 or change deliberately if 301 is mandatory; verify deployed status, destination/path preservation and absence of loops. |
| Set up Google Search Console. | **Unverified / account evidence missing.** | No Search Console setup or ownership/submission receipt was found in searched repo docs/source. Its absence from code does not prove an external property is absent. Confirm the company property, ownership, sitemap submission, indexing coverage and access. |
| Set up Google Analytics. | **Application integration prepared; live setup/receipt pending.** | Consented GA4-through-GTM boundary and runbook exist. `docs/releases.md:23` and `docs/release-1-analytics.md` record company IDs/access and actual DebugView/Realtime receipt as pending. Passing tests do not close the setup requirement. |
| Set up/add **HTML/XML sitemap**. | **XML already implemented in main; HTML not found; submission/live completeness unverified.** | Existing `src/app/sitemap.ts` generates static routes plus published article/property slugs; `src/app/robots.ts:13` points to `/sitemap.xml`. Both existed before Release 1 (history includes `ff4b5fd2`). No dedicated HTML sitemap page was found. Verify live XML content, Search Console submission and whether the audit expects both formats; navigation/footer links do not establish an HTML sitemap deliverable. |
| Set up Meta Pixel through Meta Business Suite. | **Outstanding.** | GA4 work deliberately leaves advertising consent denied and Meta/advertising tags disabled; no `fbq`/Meta script implementation was found in `src`. Company business/Pixel access, consent configuration, agreed conversions and actual receipt remain separate work. |
| Check `robots.txt` allows OAI-SearchBot; also check CDN/WAF/bot protection. | **Application robots rule permits public crawling; edge/live acceptance unverified.** | `src/app/robots.ts:9–11` has `User-agent: *`, allows `/`, disallows `/api/` and `/studio/`; no OAI-specific block exists in that configuration. This predates Release 1. It does not prove the deployed response, robots accessibility, CDN/WAF allowlisting or actual crawler access. |
| Remove homepage claims **“RERA & FCA-Regulated”** and **“RERA-Regulated FCA-Compliant”**; precise claims need qualified review. | **Already removed in main; not a new Release 1 fix.** | Deb's `164e6ed9` removed RERA/FCA trust claims from homepage, About, ServicesToggle and match funnel; it is an ancestor of current `main`. Current source search found no remaining version of those claims. References to independent regulated providers/FCA guidance in purchase-readiness copy are different claims. Live page verification and any future regulated-status wording still need their stated approval. |
| Build a popup lead form with the listed property needs, behaviour questions, social follows and separate marketing/newsletter permissions. | **Substantial Release 2 implementation; full requirement/operation remains partial.** | Detailed field mapping appears below under Priority 2 because the audit repeats this requirement. Release 1 SEO/GA4 alone does not deliver the complete lead workflow. |

### Footer and About social-link acceptance

The technical tab asks for Facebook and Instagram in the footer on every page.
Tanu's About-page tab requires Facebook to open the correct active Haus page,
Instagram to open the Haus UAE/UK `haus_of_estate` account rather than the Thai
property account, and no incorrect redirects.

Both destinations already exist in the `main` baseline, including earlier
social work `1bd9b3b1`; they are not newly fixed by Release 1. Release 2 shares
them through `src/config/social.ts:1`, used by
`src/components/layout/footer.tsx:83` and `src/app/(main)/about/page.tsx:731`:

- Instagram: `https://www.instagram.com/haus_of_estate/` — matches the audit's named handle in source.
- Facebook: `https://www.facebook.com/profile.php?id=61560983191278` — present in source, but the fetched audit names “Haus of Estate Page” without a numeric ID, so code alone cannot prove the active destination's identity.

Status: **links present and aligned in source; active-account identity, browser
redirect behavior and live page coverage still need verification.**

### Priority 2 discussion and thin content

The 18 August discussion contains suggestions as well as concrete requests.
Optional floating buttons and proposed UGC/video treatment are not silently
converted into mandatory shipped features. The matrix below maps the distinct
topics; no completed editorial or social campaign is inferred from a schema.

| Discussion recommendation | Current evidence and acceptance limit |
| --- | --- |
| Systematic content/navigation and category/taxonomy tagging | Blog post categories and category filtering exist. This does not establish the audit's intended information architecture or an approved taxonomy; editorial/navigation review is still needed. |
| Revamp thin content; supply primary/secondary keywords | The exact source list follows below. No article rewrite, keyword approval or fresh content-quality assessment was performed in this verification. Fatima/Tanu's editorial work is separate from Release 1's rendering changes. |
| Cleaner homepage; consider UGC/video | Homepage rendering changed, but that is not proof of an approved visual/content redesign. The discussion does not define a measurable UGC/video acceptance criterion. |
| Check all buttons and links | The known review-link issue has a targeted code check. A complete deployed-site link/button crawl and interaction walkthrough were not performed; do not extend that result to every control. |
| Resources/Multimedia area for news, services and downloadable guides | Existing blog/service pages provide some foundations. The current H14 reconciliation found no dedicated Latest News or newsletter-PDF workflow; the full requested area is not established as complete. |
| Better CMS tables instead of manual row/column work | The current post schema includes a structured `contentTable` block. This is evidence of table support, not proof of Deb's intended import/automation or an editor usability test. |
| Lead popup covering country, buy/rent, investment/use, location, property type, rooms, move-in date, behavioural questions and cash-abroad interest | Shared lead intake, preference capture and separate newsletter/property-match consent exist in Release 2. This check did not verify every requested field/question against the complete form journey. Hosted persistence, team receipt and Excel acceptance also remain unverified; see the email reconciliation and scenario report. |
| Correct social accounts; consider floating buttons/social follow options | Footer/About link evidence is above. Active destination identity and complete live coverage remain unverified; floating controls are an optional suggestion, not evidence of a completed requirement. |
| Visible blog references at the bottom | The post schema supports hyperlinks. No audit of visible citations across the named articles or a dedicated reference-list acceptance check was performed. Source support alone does not establish content completion. |
| Service enquiry form for inbound leads | General lead intake exists; the snagging page has quote links and optional calendar integration. A dedicated persisted snagging campaign form is still a gap in the H07 reconciliation, and actual delivery needs hosted verification. |
| Live chatbot | Release 2 includes guarded AskHaus discovery and an editable adviser handoff behind feature configuration. This is implementation evidence; production enablement, approved knowledge and end-to-end staff receipt remain unverified. |
| Include website links in social promotions, not only the bio | This is a content/publishing requirement. No live social campaign was inspected or sent, and the existence of manual publishing packs does not prove compliance. |

The Thin Content tab identifies these exact pages and **audit-time** word
counts. They have not been recounted or confirmed revised in this verification;
article bodies come from Sanity, so frontend code alone is insufficient evidence.

| Named page (relative to `https://hausofestate.com`) | Word count recorded by audit | Revision acceptance |
| --- | ---: | --- |
| `/blog/dubai-real-estate-market-insights-july-2026` | 735 | Unverified |
| `/blog/haus-of-estate-global-partnerships` | 362 | Unverified |
| `/blog/dubai-vs-london-property-returns` | 383 | Unverified |
| `/blog/transparency-in-real-estate` | 367 | Unverified |
| `/blog/uae-property-market-2026` | 498 | Unverified |
| `/blog/building-global-property-portfolio` | 448 | Unverified |
| `/blog?category=investment-guides` | 378 | Unverified; this is a category listing, not an individual article |

The supplied audit does not specify a minimum passing word count. Fatima/Tanu's
review should establish whether each page answers its intended search need with
accurate, useful material and visible sources; increasing a count alone would
not establish completion of their content request.

### Hreflang specification dated 1 September

The actual specification gives `ar`, `fr` and `en-GB` as **examples**, expressly
requires actual localized URLs, and asks for reciprocal tags whose referenced
URLs are canonical, indexable and live. Status: **deferred / prerequisites not
established**, not implemented and not yet accepted.

Current handoffs document one English URL set without agreed equivalent locale
pairs (`docs/handoffs/meeting-2026-09-07.md:22`,
`docs/handoff-personal-chatgpt.md:232`), and no alternate-language metadata was
found in the inspected app. Country filters do not establish the specified
localized alternatives. Agree the real page pairs/content ownership first;
then implement and verify reciprocal tags, canonicals, indexability and live
responses. Do not insert the audit's sample codes pointing at invented pages.

### Later email requirements, separate from the audit text

The supplied H12 backlog adds monthly thin-content revisions, daily SEO work
for a month before paid campaigns, and a proposed meeting with Surya, Shoaib
and Deb on Friday 18 September, 4:30 pm UK / 9:00 pm India. A completed month of
work, meeting acceptance and the campaign timing decision are **not established**
by this code release. Resolve whether the month-long programme delays the
snagging campaign; the audit and prepared code do not decide that schedule.

## Tests actually run on 16 September

Ran `npm run test:seo` once on current Release 2 head `52153317`:
**6 tests passed, 0 failed, 0 skipped**, exit code 0.

- Public-page allowlist excludes private, preview, draft, local and nonproduction pages.
- Only explicitly named demo hosts can opt in; wildcard/arbitrary previews remain excluded.
- Consent is versioned, expiring and fails closed.
- Analytics runtime gates scripts, discards pre-consent activity/personal-data fields,
  deduplicates pages, revokes consent and guards client navigation.
- `www` redirect configuration matches the intended permanent canonical-host rule.
- The review component source omits the unapproved review-platform links.

The two SEO tests are configuration/source assertions. They do not request the
live site, inspect Google's index, audit all pages, validate rendered schema,
measure speed or prove redirects have been deployed. The analytics tests use a
controlled runtime rather than an authenticated company GA4 connection.

Node emitted experimental type-stripping and unspecified module-type warnings;
they did not fail the tests. No dependency installation was performed.

The PR body and `docs/release-1-analytics.md:52` record earlier 13 September
TypeScript, changed-file lint, production build and six desktop/mobile browser
scenarios as passing. Those are historical recorded checks, not reruns today.
Their Google requests were intercepted, so they never proved GA4 receipt.

## Remaining evidence before declaring the audit complete

1. Agree owners and acceptance for the remaining matrix rows, especially the
   explicit 301 versus implemented 308, HTML sitemap, named thin pages and
   localized page pairs. The original audit has now been retrieved and mapped.
2. After Deb's controlled release, check representative apex/`www` URLs and
   paths, canonical tags, response status, rendered content/internal links,
   sitemap, robots directives and indexability. Compare the deployed commit to
   the reviewed release.
3. Compare like-for-like mobile performance before/after against the audit's
   **LCP <2.5 s and TBT <200 ms** targets across its affected pages, and inspect
   field Core Web Vitals when enough data exists. Do not use an unrelated local
   Lighthouse "SEO 100" score as proof that this external audit passed.
4. Inspect Search Console coverage and search performance for relevant pages
   and queries over an agreed period; verify rankings/traffic/enquiry changes
   rather than assuming them from passing tests.
5. Configure the reviewed company GTM/GA4 container, verify accepted/rejected/
   withdrawn behavior and actual mapped events in DebugView/Realtime, and
   record deployment, container version, property/data stream and date.
6. Confirm testimonial/rating provenance. The code still includes static market
   rating counts, fallback testimonials and a "Verified" label
   (`reviews-carousel.tsx:17`, `:138`; `homepage-reviews.tsx:8`). Removing external
   review links did not validate these claims.

**Conclusion:** the original audit is only partially addressed. The source
confirms several existing fixes plus prepared Release 1/2 work, but speed
targets, live deployment, account setup/measurement, content revision and other
acceptance gaps remain. There is no evidence here of ranking or traffic gains.

## How to verify the speed targets — 17 September

**No GA4 access is needed for the Lighthouse/PageSpeed speed tests.** Account
access is a separate requirement for proving analytics collection. The six
existing code checks did not measure LCP or TBT. No speed run was performed
when adding this procedure.

1. Confirm the current Release 1 and main commits, then test their production
   builds on equivalent infrastructure with the same CMS content. Keep the
   existing Release 2 working copy intact. A local production build can help
   diagnose browser work; it does not establish deployed network/server speed.
   Do not use `next dev` for acceptance measurements or compare local dev with
   hosted production. A protected test site can be measured with Lighthouse
   in an authorised browser without opening it to public indexing.
2. Run Lighthouse Performance in mobile mode with fixed Lighthouse/Chrome
   versions, viewport, CPU/network throttling and cache policy. Record whether
   consent is unset, rejected or accepted. Once the actual third-party tags
   are configured, test the accepted state too; placeholder/stub tags do not
   establish their real performance cost.
3. Start with the homepage, then `/properties`, a published property detail,
   `/blog` and a published article. Extend coverage across public page
   templates and the audit's affected URLs before claiming sitewide success.
   Ensure each test renders the real intended page, not an error or login gate.
4. Proposed acceptance protocol: five comparable mobile runs per page/build,
   retaining all HTML/JSON reports. Report the median and full range, with
   **median LCP <2.5 seconds and median TBT <200 milliseconds** as the initial
   lab criterion. These repetition/aggregation choices are our proposed test
   protocol, not a Google mandate or a criterion stated in the original audit.
   Investigate unstable or recurring failed runs rather than hiding them in
   a passing median. Record commit, URL, date, environment and consent state.
5. Compare baseline and release under those same conditions. If LCP fails,
   inspect the largest element, server response and its resource/render delay.
   If TBT fails, inspect long JavaScript tasks and third-party execution.
   Rerun the affected pages after a fix. Measure cumulative Release 2 separately
   because its additional features can change performance.
6. After deployment, verify real-user LCP using PageSpeed Insights/CrUX or
   Search Console when sufficient traffic exists. Google's good threshold is
   **LCP ≤2.5 seconds at the 75th percentile**, assessed separately for mobile
   and desktop; the original audit asks for the stricter wording “below”.
   Public CrUX data covers a rolling 28-day window, so early results mix old
   and new releases. A new/private test URL may have no field data. TBT is a
   lab metric; field responsiveness uses INP, and passing LCP/TBT alone does
   not establish a full Core Web Vitals pass.

Sources: [Google LCP guidance](https://web.dev/articles/lcp),
[Google TBT measurement guidance](https://web.dev/articles/tbt),
[PageSpeed Insights lab/field data](https://developers.google.com/speed/docs/insights/v5/about).
