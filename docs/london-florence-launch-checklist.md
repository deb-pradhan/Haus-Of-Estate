# London and Florence: one website release

Updated 15 October 2026. Continue draft PR #16 on `suryak02/azizi-florence-content-scaffold`. The website scaffolding and seven Sanity drafts are prepared. This checklist does not authorise unrelated publication or feature activation.

## What visitors will see

- **London:** catalogue card → three-bedroom terraced house → £500,000, approximate gross internal floor area of 889.9 sq ft / 82.67 m², labelled existing/proposed interior boards and a separate uncropped floor plan. No road name, postcode or precise location.
- **Florence:** one catalogue community card → large community overview → Villas / Townhouses → bedroom collection → brochure design, matched images, plot area and built-up area, and full floor-plan images. Villas start at AED 3,350,000; townhouses at AED 1,890,000, retaining the supplied Clusters 1 & 2 scope.

The Florence relationship uses the existing `property` documents: `unitType: Development` on the overview, and matching `masterDevelopment: Azizi Florence`, `community: Florence`, `city: Sharjah`, `country: United Arab Emirates` on each collection. Country/city options derive from published inventory. This is not a second content model or a local-only catalogue.

## Exact release records

Find these in the existing Sanity Studio under **Properties → Draft**. The table gives their stable document IDs without the native `drafts.` prefix. Keep these identities; do not reimport the earlier source IDs as new properties.

| Listing | Document ID | Public path | Designs / plan-image uses |
| --- | --- | --- | --- |
| London | `property-north-london-three-bedroom` | `/properties/north-london-three-bedroom-property` | 1 separate floor plan |
| Florence overview | `9405e5db-9b61-4fd7-bb26-ef4f89eb71c8` | `/properties/azizi-florence` | Community imagery |
| Florence 4-bedroom villas | `0f23c71e-459d-4e00-81c3-2dfab801c247` | `/properties/azizi-florence-4-bedroom-villas` | 2 / 4 |
| Florence 5-bedroom villas | `413a49b8-c0f4-4e11-8e37-2c42095281cb` | `/properties/azizi-florence-5-bedroom-villas` | 2 / 4 |
| Florence 6-bedroom villas | `5c86a687-3e2f-40d9-aa03-7ff580313158` | `/properties/azizi-florence-6-bedroom-villas` | 3 / 6 |
| Florence 3-bedroom townhouses | `08e9b9ea-74ba-4b61-90b5-5ec54a9cfc47` | `/properties/azizi-florence-3-bedroom-townhouses` | 5 / 10 |
| Florence 4-bedroom townhouses | `09828cf9-b9d5-409f-8e4a-658fcdaa75a6` | `/properties/azizi-florence-4-bedroom-townhouses` | 7 / 14 |

Some plan images cover multiple designs and are reused. The counts above describe assignments, not unique plans or available units. Nineteen Florence designs and four interior-scheme entries are uploaded. No finish-choice entitlement, handover, payment plan or current unit stock is inferred. Conflicting plot figures stay withheld. Full brochures remain private; automated delivery is a separate feature.

## Checked against the uploaded content

Authenticated read-only check on 15 October found all seven records as native drafts, with all **84 unique image references resolving to Sanity image assets**. The five Florence children match the overview relationship exactly. The real public community query was evaluated offline: current drafts yield no public community; changing workflow status alone still leaves native drafts excluded; simulated native publication yields one community and five collections.

The complete private snapshot and summaries are outside Git at `C:/Users/surya/Downloads/Haus-property-release-readiness-2026-10-15/`. No CMS records were changed by this check.

Draft validation previously passed. Validation of **local copies** with workflow status set to Published found:

- All seven need the existing editorial approval record: content/factual and SEO/tracking approval, actual approver name and approval time. Do not auto-fill an approval or describe a software check as factual verification.
- All seven warn that `listingState` is unset. Confirm the appropriate marketing state with the content owner; this field is separate from ready/off-plan classification and does not establish available individual Florence units.
- The community overview warns that it has no numeric sale price. Its UI intentionally derives separate Villa/Townhouse starting prices from published collections; do not invent a single overview price to silence that warning.
- No other schema errors or warnings were reported. Missing commercial data remains missing rather than being guessed to pass validation.

## Deployment and publication order

1. **Deb reviews and deploys the latest PR #16 revision.** Use the [existing deployment handoff](deb-release-2-handoff-2026-09-28.md). Keep accounts, saved content, AskHaus, intake and delivery disabled. Resend/Retell and DNS changes are not prerequisites for displaying these listings. Update any deployed Studio to use the same current schema before editorial review.
2. **Check the new deployment before publishing.** Confirm it has the shared property renderer, floor-plan sections, concept captions and the published community query. The old main revision cannot display the supplied plans or uncropped comparison boards properly.
3. **Finish the existing Studio review and publish the intended records.** Record genuine approvals, set website publication state to Published, and use native Sanity Publish. Setting the status field on a native draft alone will not release it. London may be released independently; Florence's complete experience requires its overview and all five collections. Leave unrelated drafts untouched.
4. **Verify the public result on desktop/mobile:** catalogue → London; UAE → Sharjah → Florence → each home collection → design → full plan. Check prices and cluster scope, plot versus built-up labels, visible concept captions, parent breadcrumbs, image loading and no horizontal overflow. Confirm both HTML and XML sitemaps and unchanged Monaco/Al Furjan listings.

The signed Sanity webhook must use the existing `/api/revalidate/path` endpoint and matching server secret. The cache wrapper now tags query results with the same `sanity` tag that the webhook invalidates. Property changes invalidate the bounded `/properties/[slug]` page pattern, catalogue, location endpoint and both sitemaps, so changing a collection also refreshes its parent showcase. Route invalidation takes effect on the next request; location responses may also need their existing CDN freshness period. No webhook, secret or hosting configuration was changed here. Verify an actual signed event after deployment rather than claiming live refresh from mocked tests.

For source receipts and prior tests, see the [14 October property release handoff](property-release-2026-10-14.md).

## Verification on 15 October

- Typecheck and scoped ESLint passed.
- Full unit suite passed: 617 tests across 79 files, including the query-cache/webhook contract and property publication refresh targets.
- Fresh production build passed using an isolated output directory, with unfinished features and intake/delivery disabled.
- Read-only Sanity asset and relationship checks and local publication-state validation are recorded above. No CMS mutation, publication, deployment or customer messaging took place in this follow-up. Hosted webhook behaviour and the public desktop/mobile journey still require verification after deployment.
