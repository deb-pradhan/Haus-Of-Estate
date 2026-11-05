# Florence release handoff — 20 October 2026

This focused branch starts from main `128715a580882cf22c87a360b3c355e236c443e8`, after the London/footer release. It ports the Florence presentation from PR #16 without the other Release 2 features. PR #18 (`mega-upgrade`) also changes property pages; review the integration again if either branch merges first.

## What this makes possible

The catalogue groups the published Florence overview and matching published collections into one community card. The card leads to a wide community overview, separate Villas and Townhouses sections, then a bedroom collection. A design selector switches the matched exterior images, built-up area, confirmed plot area and complete floor-plan spreads. Interior palettes are brochure references, not promised choices or included finishes.

This uses the existing `property` documents and relationship fields: overview `unitType: Development`; collections `masterDevelopment` matching its title, with matching country, city and community. There is no hardcoded public Florence route, parallel content store, or currency conversion. Normal properties, including London's concept disclosures and uncropped plan, keep the shared detail presentation.

Full PDFs are not exposed. Existing email enquiry links include the chosen collection/design in the subject. Automatic brochure delivery and native lead capture are separate work; this release does not promise that a form has saved or emailed anything.

## Existing records — do not reimport or duplicate

Read-only authenticated verification on 20 October found these same six native drafts, unchanged from the 15 October snapshot:

| Slug | Native draft ID | Designs |
|---|---|---:|
| `azizi-florence` | `drafts.9405e5db-9b61-4fd7-bb26-ef4f89eb71c8` | Overview |
| `azizi-florence-4-bedroom-villas` | `drafts.0f23c71e-459d-4e00-81c3-2dfab801c247` | 2 |
| `azizi-florence-5-bedroom-villas` | `drafts.413a49b8-c0f4-4e11-8e37-2c42095281cb` | 2 |
| `azizi-florence-6-bedroom-villas` | `drafts.5c86a687-3e2f-40d9-aa03-7ff580313158` | 3 |
| `azizi-florence-3-bedroom-townhouses` | `drafts.08e9b9ea-74ba-4b61-90b5-5ec54a9cfc47` | 5 |
| `azizi-florence-4-bedroom-townhouses` | `drafts.09828cf9-b9d5-409f-8e4a-658fcdaa75a6` | 7 |

All 78 unique Florence image asset references resolve in `jdxbkry4 / production`. There are 26 unique plan images, 38 design-plan assignments and four interior-scheme entries. Source PDFs, the 3.83 GB original render package and the private snapshot remain outside Git.

Confirmed Clusters 1 & 2 price ranges, in AED:

| Collection | Starting | Maximum |
|---|---:|---:|
| 3-bedroom townhouses | 1,890,000 | 3,017,000 |
| 4-bedroom townhouses | 2,260,000 | 3,418,000 |
| 4-bedroom villas | 3,350,000 | 5,115,000 |
| 5-bedroom villas | 4,200,000 | 6,404,000 |
| 6-bedroom villas | 4,950,000 | 8,205,000 |

These are collection ranges, not prices of whichever design is selected. The draft sale/off-plan classifications are retained; they do not establish current individual stock or a completion date. No payment plan, handover date, unit identifier, bathroom count or finish entitlement is invented.

Sonia's 7 October clarification establishes the public label **Built-up area** for Florence's stored `sellableAreaSqFt` figures. Plot area stays separate. Three 4-bedroom townhouse designs (`novoli-4-home-corner`, `novoli-6-home-corner`, `spada-8-home-corner`) have conflicting plot figures. Their numeric plot areas and internal notes are omitted from the query and client props. Their six assigned ground/first-floor spreads were visually checked and SHA-1 matched to Sanity assets: they do not contain the disputed plot-summary figures. Conflicting summary pages are not assigned. Do not add those pages until reconciled.

## Deb's release sequence

1. Review this focused PR against current main, including overlap with PR #18. Merge and approve the Railway deployment through the usual review process.
2. Confirm the deployed code and Studio use the compatible `property` schema, including `Development`, `designVariants`, `interiorSchemes`, and optional source price fields. Preserve existing record IDs and the standalone Studio's editorial controls.
3. Review the six existing drafts with Sonia. Actual content/asset rights and SEO/tracking approvals, approver and time are still absent; `verification.status` is `unverified`, and `listingState` is unset. Confirm the intended marketing state separately from available unit inventory. Do not fabricate approvals or force publishing by importing old preparation files.
4. Once approved, set website publication state to Published and use native Sanity Publish for the overview and the five collections. Publishing creates the normal non-draft documents. A Git merge alone does not publish these records.
5. Verify `/properties` → `/properties/azizi-florence` → each collection on desktop and mobile, including design switching, plan links, price scope, page metadata and enquiry destination. Detail/catalogue/sitemap revalidate every 60 seconds; allow revalidation after publication.
6. Confirm published-only catalogue and sitemap behaviour. Drafts and release versions, including perspective-remapped drafts, stay excluded.

Kore, AskHaus, currency switching, careers intake, mortgage calculations, bulk media imports, automatic brochures and campaigns are outside this PR. No Sanity records, production deployment or customer messaging were changed during preparation.

## Local review

The review route is development-only, noindex, and outside the enquiry-modal layout. It reads only the six explicit Florence draft IDs from an externally supplied snapshot and uses the same detail renderer. Production returns 404 before any file read.

```powershell
$env:HAUS_FLORENCE_PREVIEW_FILE='C:/Users/surya/Downloads/Haus-property-release-readiness-2026-10-15/snapshot.json'
npm run dev -- --hostname 127.0.0.1 --port 3020
```

Open `/dev/florence-preview`, then follow the community/collection links. Enquiries are disabled. This preview is not evidence of publication.

## Verification

- TypeScript, scoped ESLint and Sanity schema extraction: passed. Schema output is in ignored local build storage; temporary CLI configuration was removed.
- Fresh production build: passed. The existing local multi-lockfile/root warning remains; no dependency or hosting configuration was changed.
- 32/32 tests passed across Florence detail/publication, London media, technical SEO, analytics and careers-offline suites. The careers runtime test used the built local server (no skipped tests or real application emails).
- Read-only Sanity audit: six native drafts unchanged; 78/78 image references resolved. No publication/import/upload performed.
- Browser: community and all five collections reviewed at desktop and 390 px mobile width without horizontal overflow; villa design and townhouse palette switching checked. Confirmed/withheld plot behaviour and whole-plan links checked. London and Monaco production routes still render; London disclosures, plan and approximate GIA retained.
- Built-server HTTP checks: preview index/detail and unpublished Florence public route return 404 even with the local snapshot setting present. Published catalogue, London, Monaco and sitemap return 200; Florence is absent from catalogue/sitemap.
- Read-only peer review: no actionable defects found; schema fields match existing source records. Local review is not evidence of a production deployment, published Florence content or email receipt.
