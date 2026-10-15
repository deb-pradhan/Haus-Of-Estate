# Urgent London and website corrections — 15 October 2026

Surya explicitly requested a new, focused branch from current main after discussing the release with Deb. This is the exception to the earlier cumulative Release 2 workflow. Branch: `suryak02/urgent-london-footer`. PR #16 remains intact and draft for its broader work, including Florence.

## Main compared with PR #16

Freshly fetched starting references:

- Main: `5e092e00be7813aa1c17af759ed636146c601c36`.
- PR #16: `53d1f1c5f5e2c3e52cb08c92a4f180b12e6b97ef`.
- Main is already an ancestor of PR #16: **104 commits ahead, zero behind**. GitHub reported PR #16 mergeable.
- The full difference spans **504 files, 66,576 additions and 10,075 deletions**. It includes Florence, search/currency/navigation changes, careers reopening, services, account and saved-content flows, AskHaus, durable lead delivery, database migrations, dependencies and deployment configuration.
- Deb's direct GA4 and Railway build settings are already integrated into PR #16 through merge `773f3690`. There is no unmerged main change at these references. A clean Git merge is not proof that this larger release is operationally ready.

This focused branch starts directly from main and adapts only the urgent display/content support. It does not import the Release 2 dependency upgrades, database migrations, Docker/startup changes, account/lead architecture, careers reopening or Florence journey.

## Included

- **London property:** preserve the existing main property page and email enquiry link; add supported Terraced House taxonomy, Ready display from availability, visible breadcrumbs, full comparison boards with their concept captions, uncropped linked floor plan, and approximate gross internal floor area. Concept imagery uses the branded social-image fallback. Ordinary photo listings keep their existing crop and display behaviour.
- **Publication boundary:** property queries explicitly exclude native drafts and release versions, even if a draft's workflow status is changed to Published. London is not automatically promoted to the homepage.
- **Footer/legal identity:** legal company name and number, jurisdiction, registered office and separately labelled trading address, ICO registration and official links, legal-name copyright, and the supplied white 80px PolicyBee badge. Remove the retired registration claims wherever they occur in these main website surfaces. Replace existing legal-page identity/address placeholders without importing new backend/privacy claims.
- **Blogs:** company bylines, including the article's structured metadata, and the previously reviewed cover framing. Existing CMS author records are preserved. Account access revocation is an administrator task and is not established by hiding a public byline.

Source context: Sonia's 23/29 September blog correction requests, the approved 22/25 September company details and 2 October badge instruction, the 7 October London information and floor plan, and the 14/15 October request to prioritise London. On 15 October Sonia referred the outstanding careers descriptions to Archi, who acknowledged. No descriptions accompanied that reply; existing main careers closure remains unchanged.

## London publication after deployment

1. Review this focused PR, merge it into main and deploy the resulting revision using the existing Railway service/configuration. No new database migration, provider credential or email automation is required by this change. Existing analytics and application configuration are retained.
2. Confirm the deployed revision supports floor plans and concept captions. Footer and blog display changes become visible with the code deployment; they do not require a property publish.
3. In the existing Sanity Studio (`jdxbkry4`, `production`), review **only** `drafts.property-north-london-three-bedroom`, slug `north-london-three-bedroom-property`. Use the existing Studio approval workflow where required, then set the website status to Published and use native Sanity Publish. Do not replace the current richer standalone Studio schema with a reduced schema or remove unknown document fields. All other drafts, including Florence, remain held.
4. Verify `/properties` → `/properties/north-london-three-bedroom-property`: £500,000, three bedrooms, Terraced House, Ready, North London / London / United Kingdom, and **Approx. Gross Internal Floor Area: 889.9 sq ft / 82.67 m²**. Confirm the complete floor plan and its approximate-measurement notice, existing/proposed image captions, and no road/postcode or invented plot/bathroom details. The draft's `featured: false` means publication alone does not add it to the homepage.
5. Check the public result on desktop and mobile, footer/legal identity, blog cards/article credits and XML sitemap. Confirm Monaco and Al Furjan still render correctly. This branch retains main's existing fetching/revalidation implementation; it does not install the different Release 2 signed-webhook/cache system. If stale content persists, inspect the existing deployment/cache configuration rather than guessing a new webhook contract.

The London images and plan were already uploaded. Do not upload raw source folders, duplicate the property, publish Florence, enable customer emails or wait for Resend/Retell to release London. Unconfirmed commercial particulars remain unset.

## Verification

15 October results:

- Fresh dependency install from main's unchanged lockfile and Prisma client generation succeeded. No database connection or migration was performed.
- TypeScript passed. The fresh production build passed with 63 generated pages; only existing published property slugs (Al Furjan and Monaco Mansions) were pre-rendered. No draft was published to make the build succeed.
- **25 tests passed, zero failed, one skipped** across the property media/publication, blog publication, SEO, analytics and careers-closure suites. The skipped case requires a running built-app URL; it is not counted as a pass. Component rendering and GROQ tests use synthetic records, not applicant or customer data.
- Scoped ESLint passed for the London, blog, footer, shared identity, home/services/renovations, query/schema and new test changes. The three legal pages retain **28 pre-existing errors and one warning**; comparison against main found no newly introduced diagnostics there. Repository-wide lint is not claimed clean.
- `git diff --check` passed. Dependencies, Docker/Railway, analytics, auth, database schema and careers closure remain unchanged from main.
- The read-only production Sanity check at **12:32 UTC on 15 October** confirmed `drafts.property-north-london-three-bedroom` remains a draft, revision `00fe5fb0-f827-483c-b8e2-b15675410b19`, with its hero, four gallery images and one plan asset resolving. No CMS writes were made.
- No fresh desktop/mobile browser result is claimed: local inspection was blocked by browser security policy. Review/deployed visual checks remain required. Mocked analytics checks do not establish real GA4 receipt.

Local checks do not establish a successful Railway deployment, native Sanity publication or hosted visual acceptance. No production content, account permissions or outbound customer messaging is changed by this branch preparation.

## Pre-merge review — 16 October 2026

Surya explicitly authorised merging this focused PR after local visual/function checks, leaving Railway build approval with Deb. This does not authorise publishing Florence or merging PR #16.

Browser inspection now works through the same supported in-app browser. The historical tool rejection reported a disallowed URL protocol even though the supplied target was HTTP; it did not establish a blanket localhost restriction. An internal error-page URL is a possible explanation, not a confirmed root cause.

- Reviewed the unchanged `da9be9c0` production build on loopback port 3019: catalogue-to-Monaco navigation, photo rendering, breadcrumbs, desktop footer, loaded 80px white PolicyBee badge, blog listing/article company attribution and the legal identity block. Mobile blog/footer review at 390px showed no horizontal overflow; inspected pages produced no browser console errors.
- Reviewed London on desktop and mobile using an explicitly labelled, unpublished SSR fixture outside Git. It rendered the exact committed property component with the saved native draft revision `00fe5fb0-f827-483c-b8e2-b15675410b19`, real Portable Text, real Next Image markup and production CSS. All six images loaded, comparison labels/captions remained visible, the GIA text was readable, and the full floor-plan link opened the supplied 1169 × 1983 image in a new tab. No horizontal overflow was found.
- The London fixture substitutes the saved draft at the data-fetch boundary and uses unoptimised CDN images; it is not a production route, publication test or hydrated full-site preview. Public draft exclusion remains covered separately by the passing GROQ tests. No app gates or CMS records were changed for this review.
- Reran the careers-closure suite against the running production build: **4/4 passed**, including the previously skipped page/role/prefetch/application-entry-point test. Together with the unchanged 15 October suites, all 26 distinct checks now have a passing result. No application email was sent.
- No new release-blocking anomaly was found. This follow-up changes documentation only; app code, dependencies and build artifacts are unchanged. Deployment verification and native London publication remain separate steps after the merge.
