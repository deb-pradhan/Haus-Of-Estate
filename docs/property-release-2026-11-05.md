# Florence, Kore and Dubai article cover release — 5 November 2026

This branch starts from main `128715a5` and includes the focused Florence implementation from PR #19, plus Kore's supplied listing details and the requested Dubai article cover correction. It is a separate urgent release, explicitly requested by Surya on 5 November. The larger PR #16 overhaul, later redesign, native lead capture, Resend delivery and careers reopening are outside this release.

## What changes on the website

- Florence uses the existing Sanity `property` model: one community overview, five villa/townhouse collections and 19 source-matched designs. The public catalogue groups these into one Florence community entry. Images, built-up area and whole floor plans follow the selected design.
- Kore is one Apartment project listing with three home-type rows: studio, one-bedroom and two-bedroom. The headline price is the supplied studio starting price; the rows show their own starting prices and sizes. These are a development offering, not assertions that particular units remain available.
- The Kore entry deliberately has no invented or borrowed property photograph. Approved Kore imagery can be added to its normal featured-image/gallery fields in Sanity later.
- London retains its existing concept-image disclosures, uncropped floor plan and approximate gross internal area. Published-only queries keep draft content out of the catalogue and sitemap.
- The published Dubai article's cover was replaced in Sanity with the original 1920 × 1080 Canva PNG on 5 November. The update was guarded by the previously read document revision. Its article body, author and publication date were preserved; the PR's image-rendering changes accompany that source replacement.

## Source boundaries

Florence's AED prices remain the supplied Clusters 1 & 2 ranges. Do not assign a collection's starting price to an individual selected design. Sonia confirmed the public label “Built-up area” for Florence; plot area remains separate. Keep the conflicting plot markers on `novoli-4-home-corner`, `novoli-6-home-corner` and `spada-8-home-corner`; their disputed numeric values remain hidden. Payment schedules, handover dates and interior-choice entitlement are not established by the material reviewed so far.

Kore's prices, sizes, amenities, building configuration, payment plans and Q4 2028 target come from Sonia's 20 October message, supplied again by Surya on 5 November. “Starting size” is intentional: the source does not define those figures as built-up, internal or plot area. The optional 60/40 plan retains the stated 10% price increase and three-year post-handover period; do not calculate a revised price or invent instalment dates. EOI figures are omitted until their currency and conditions are confirmed. Imtiaz identity is corroborated separately by its official Kore page. No approved Kore image package was found locally or in the searched email.

## Code deployment and CMS publication are separate steps

**Merging this PR does not publish a draft property.** Resend is not needed to display these listings; enquiries can use the existing property-specific email links.

1. Review the PR, merge through the repository workflow and have the Railway owner approve/deploy the new revision. Verify the deployed property renderer supports the Florence design fields and Kore home-type fields before publishing their records.
2. Use the existing standalone Studio for project `jdxbkry4`, dataset `production`, with a compatible `property` schema. Retain its editorial controls and all existing documents. Do not replace the Studio configuration wholesale with this app's older base configuration.
3. Run the read-only preflight below through the authenticated Sanity CLI. Fresh authenticated reads on 5 November confirmed the six Florence drafts and their image references. Direct `getCliClient()` invocation without the CLI's `--with-user-token` did not inherit authentication; that was an invocation issue, not a missing-account/access blocker. A public query cannot determine whether private drafts exist. Refresh the revisions immediately before publication.
4. Open the **existing six Florence drafts** using the IDs below. Surya explicitly requested these listings for the website on 5 November; preserve that actual publication request without treating it as independent verification of stock, condition, sizes or rights. Review the source-supported presentation and retain any subsequent editorial edits. Record only actual approval information where the Studio asks for it. Set their website Status to Published, then use native **Publish** for the overview and each collection after the compatible renderer is deployed.
5. Open the **existing Kore draft**, `drafts.kore-wellness-residence`, slug `kore-wellness-residence`. It was created with `createIfNotExists` on 5 November; **do not import it again**. `scripts/kore-wellness-residence.staging-draft.ndjson` is the source preparation record, not an instruction to overwrite the CMS. Reconcile any later corrections into the existing draft, review it in Studio, set website Status to Published and use native **Publish** after deployment. Keep `featured: false` unless specifically selecting it for the homepage.
6. Wait for the normal 60-second revalidation, then verify `/properties` → Florence community → all five collections/designs, and `/properties/kore-wellness-residence`. Check desktop/mobile images, full plans, starting prices, payment-plan caveat, approximate/starting area labels, enquiry destination and sitemap. Verify London still renders correctly.
7. Run the preflight with `--expect-published` after publication. If it reports missing drafts without an authenticated session, stop and sign in; do not create duplicates to compensate. If someone changed the drafts after the review, reread the recorded revisions and reconcile those edits before continuing.

| Slug | Existing native draft ID |
|---|---|
| `azizi-florence` | `drafts.9405e5db-9b61-4fd7-bb26-ef4f89eb71c8` |
| `azizi-florence-4-bedroom-villas` | `drafts.0f23c71e-459d-4e00-81c3-2dfab801c247` |
| `azizi-florence-5-bedroom-villas` | `drafts.413a49b8-c0f4-4e11-8e37-2c42095281cb` |
| `azizi-florence-6-bedroom-villas` | `drafts.5c86a687-3e2f-40d9-aa03-7ff580313158` |
| `azizi-florence-3-bedroom-townhouses` | `drafts.08e9b9ea-74ba-4b61-90b5-5ec54a9cfc47` |
| `azizi-florence-4-bedroom-townhouses` | `drafts.09828cf9-b9d5-409f-8e4a-658fcdaa75a6` |
| `kore-wellness-residence` | `drafts.kore-wellness-residence` |

### Read-only preflight

Run through an authenticated Sanity CLI session:

```powershell
npx sanity exec scripts/check-property-release.mjs --with-user-token
# After native publication:
npx sanity exec scripts/check-property-release.mjs --with-user-token -- --expect-published
```

Alternatively, run `node scripts/check-property-release.mjs` with a read token already configured securely as `SANITY_API_READ_TOKEN`. Do not paste a token into chat, commit it, or put it in a public build setting.

The checker records native draft/public IDs and revisions, detects duplicate slugs and missing assets, checks the expected types/design counts and disputed plot markers, and reports recorded approvals without creating them. It only reads. A pass establishes consistency of the current CMS records; it does not establish current stock, legal rights, production deployment or actual enquiry delivery.

## Release evidence

The 5 November content receipt is retained outside Git at `C:/Users/surya/Downloads/Haus-property-release-2026-11-05/content-receipt.json`. It records Kore's native draft creation and the narrow published-cover update:

- Blog document: `aef74ca4-762a-4e73-ae9e-99d540439167`.
- Previous revision: `6moykHloBCXRFJXfXRXtL5`; resulting revision: `ORX5EbW2WAO1ItuPxqq7yd`.
- New Canva cover asset: `image-d779c361dcdb87ff32a4eb6208c2bbe6be2accd1-1920x1080-png`.
- The fresh Florence source snapshot is retained in the same external directory as `snapshot.json`.
- Florence and Kore property records remain native drafts pending deployment; no property publication, deployment or customer messaging was performed as part of this preparation.
- Fresh authenticated read-only preflight at **18:08 UTC on 5 November** passed with seven native drafts, all 19 Florence designs, zero duplicate-slug/identity issues and zero unresolved image references. No corresponding published property documents or recorded editorial-approval fields were present. The publication request itself is documented above; the checker does not manufacture approval fields.
- Release-checker regression tests: **4/4 passed**; scoped ESLint passed. The unauthenticated direct invocation correctly fails before querying; the documented `sanity exec --with-user-token` invocation succeeds with the existing signed-in account.

### Combined release verification

- Production `next build` passed on the combined branch, including TypeScript checking and all 65 generated pages. Standalone `tsc --noEmit`, scoped ESLint and `git diff --check` also passed.
- Sanity schema extraction passed with the new optional home-type schedule and target-completion fields. Its output is retained outside Git with the other local release evidence.
- **40/40** regression tests passed for Florence publication/design rendering, Kore source figures and mixed-bedroom filtering, London media, blog covers, SEO, analytics and the read-only publication checker. **4/4** careers-disabled tests passed against the locally built production server; no skipped tests.
- The production server returned 200 for the catalogue, London, Monaco and sitemap. Both development preview routes returned 404 in production. Unpublished Florence/Kore pages returned 404 and remained absent from the public catalogue and sitemap.
- Browser review covered the Florence catalogue/community/collection journey, design switching, separate built-up/plot figures and whole floor-plan links. Kore's three-row price/size schedule was checked at narrow mobile width without horizontal page overflow. A desktop Florence hero-width issue found during review was corrected and rechecked.
- A transient development hydration warning appeared during viewport/HMR changes. A fresh reload did not reproduce it; this is not evidence of a production failure. Automated rendering checks and the final production build passed.
- The live Dubai article was rechecked after revalidation: HTTP 200 and the new Canva asset in the rendered page, followed by visual confirmation of the sharper cover. Only `_rev`, `_updatedAt` and `featuredImage` changed on the published document.
- Freshly fetched `origin/main` remained `128715a580882cf22c87a360b3c355e236c443e8` and is an ancestor of this branch. The original Release 2 working copy, unpublished work and source archives were preserved. No direct main push, PR merge or deployment was performed.

Historical PR #19 checks are not a substitute for these combined-release checks. This new PR incorporates its focused Florence implementation; do not merge both independently without reconciling their overlap. PR #16's wider overhaul and Deb's PR #18 remain separate review work.
