# London and Florence release handoff — 14 October 2026

Surya relayed Sonia's request to show the London property and the website updates on the public site, and asked to release Florence with the accepted community/collection/design journey. Continue the existing Release 2 branch and draft PR #16. This request does not enable automatic customer emails, accounts, saved content, AskHaus or careers intake.

## Current release evidence

- GitHub's latest recorded successful Railway production deployment is `6781354479`, created 1 October 2026 and successful at 09:57:48 UTC, for `5e092e00be7813aa1c17af759ed636146c601c36`. This is deployment-record evidence, not a new inspection of Railway settings.
- At the start of this work, PR #16 was open, draft and mergeable at `1978e97a869e806811b02fc3545c4fcdb755cb46`, 102 commits ahead of main and zero behind. Main lacks the new property renderer, floor plans and Florence design presentation.
- Authenticated Sanity read on 14 October succeeded for project `jdxbkry4`, dataset `production`. Six existing Florence native drafts retain the September approved sale/off-plan classifications and prices. They had no design variants or floor plans. No North London document matched the supplied slug.
- The complete raw preflight snapshot is saved privately outside Git at `C:/Users/surya/Downloads/Haus-property-publication-2026-10-14/sanity-all-before.json`. It contains all fifteen property records, including unrelated drafts. Original property assets remain outside Git.

## Sanity draft sync completed

The reviewed `preflight-02` plan was executed once using `scripts/prepare-property-publication.mjs`. The verified receipt and before/after snapshots are in `C:/Users/surya/Downloads/Haus-property-publication-2026-10-14/sync-01/` outside Git.

- Created `drafts.property-north-london-three-bedroom` with the six optimised images, supplied floor plan and confirmed £500,000 / three-bedroom / terraced / ready details.
- Updated the five existing Florence collection UUID drafts with nineteen designs and four interior-scheme entries, including matched floor plans and source-backed areas. The community overview needed no content change.
- Uploaded sixty-two selected JPEGs; the existing Florence hero/gallery assets were reused. No PDFs or raw source archives were uploaded.
- All seven intended records remain native drafts with `status: draft`. No publication or editorial approval metadata was invented. Existing Florence prices, copy, sale/off-plan classification and document identities were preserved.
- Postflight comparison verified every changed field and all unrelated property revisions, including existing published records. Sanity document validation against the current schema returned zero errors or warnings for all seven target drafts.

The utility defaults to local preflight, requires a hash-bound reviewed plan and complete unchanged snapshot, uses revision-guarded mutations and has no publication operation. Its eleven focused tests passed.

## Required release order

1. **Completed:** sync the reviewed content into the existing Florence drafts and the new London draft. Keep publication as a separate operation.
2. Review and deploy the updated Release 2 application through the existing Railway project. Keep unfinished intake/delivery/account/assistant flags disabled, as documented in `deb-release-2-handoff-2026-09-28.md`. This website release does not require customer email automation to be ready.
3. Verify the deployed renderer and published-only community query, then finish Studio editorial review and publish the intended seven property records. Confirm catalogue cards, public collection links, design switching, full plans, prices, captions and sitemap discovery on the actual deployment.
4. Confirm the existing Al Furjan, Monaco and unrelated property records remain unchanged. Do not import the older Florence source IDs as additional properties.

Publishing the older documents before the new renderer is deployed will not reproduce the accepted local preview. Deploying code alone also does not publish native Sanity drafts.

## Public application changes and checks

- The catalogue groups eligible published collection records under their published development overview using the existing `masterDevelopment`, community, city and country fields. Matching child filters still apply, and grouped records do not also appear as duplicate cards.
- Development details use a large community hero followed by Villas and Townhouses, prices scoped to the supplied clusters, and links to collection designs/plans. Collections link back to their community through breadcrumbs and a visible parent link.
- The new query explicitly excludes native/normalised drafts, release versions, unpublished and withdrawn/sold records. Unpublished parents do not expose child navigation. No local bundles are read by production routes.
- London concept boards use uncropped, captioned presentation on catalogue and homepage cards. Social metadata uses the branded fallback to avoid cropping away BEFORE/AFTER labels. Existing ordinary photographic cards and delegated consent-gated click tracking remain intact.
- Full Vitest run: **78 files / 616 tests passed**. SEO/analytics checks: **9 passed**. Publication-preparation checks: **11 passed**. TypeScript, scoped ESLint and whitespace checks passed. The first full run caught a missing-`_originalId` GROQ null case; the query was corrected and the complete suite passed afterward.
- Fresh production build passed using isolated `.next-property-release-check` output with unfinished features and analytics disabled. It compiled, typechecked and generated all ninety-two static-page tasks without changing the local preview output. The build's automatic TypeScript include additions were restored to their pre-build contents.
- No new desktop/mobile browser verification is claimed: the local URL was blocked by browser security policy in the preceding preview work. Production visual verification remains in the release checklist.

## Expected public paths

- Catalogue: `/properties`
- London: `/properties/north-london-three-bedroom-property`
- Florence community: `/properties/azizi-florence`
- Villa collections: `/properties/azizi-florence-4-bedroom-villas`, `/properties/azizi-florence-5-bedroom-villas`, `/properties/azizi-florence-6-bedroom-villas`
- Townhouse collections: `/properties/azizi-florence-3-bedroom-townhouses`, `/properties/azizi-florence-4-bedroom-townhouses`

These are release destinations, not claims that the pages are currently public. Exact London addresses/postcodes remain excluded. Its supplied boards remain labelled proposed AI interiors; the full floor plan states approximate gross internal floor area of 889.9 sq ft / 82.67 m². Florence pricing keeps its Clusters 1 & 2 scope, conflicting plot figures remain withheld, and no new stock, handover, payment-plan or buyer finish-choice claims are added.

## Email and DNS boundary

Resend is the existing supported email provider integration. Retell is a separate voice-agent product and is not needed to display listings or deliver the planned property brochures. Customer brochure fulfilment remains separate implementation/configuration work.

DNS is not a dependency for this property-content release on the existing website domain. Sending from a Haus domain through Resend does require the sender domain to be verified; if already verified, no repeat DNS change is needed. Otherwise the DNS administrator must add the exact provider-supplied records. Do not alter inbound mailbox routing or guess DNS values. Reference: https://resend.com/docs/add-a-domain.
