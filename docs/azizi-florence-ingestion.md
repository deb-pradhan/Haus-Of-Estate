# Azizi Florence: source assessment and local draft preparation

This is an internal evidence and preparation record. The local Florence content now comprises one development overview and five home-type collections: four-, five- and six-bedroom villas, plus three- and four-bedroom townhouses. All six use the existing Sanity `property` model and retain native draft IDs. They are prepared for local review, not published listings or available-unit inventory. Sonia's pricing and confirmed unit-size information remain outstanding. Haus confirmed that this Sharjah project does not require a QR code.

## Sources actually received

The current image package is `C:\Users\surya\Downloads\OneDrive_2_9-4-2026`. It contains **109 raster images, 3,832,154,969 bytes** (approximately 3.57 GiB): 87 JPG, 17 JPEG and five PNG files. No PDF, video, ZIP, written fact sheet or independent commercial schedule is inside that image package.

| Source folder | Images | Contents |
| --- | ---: | --- |
| `01_Masterplan Cameras` | 7 | Aerial and masterplan visualisations |
| `02_Villas & Townhoses Cameras` | 48 | Four-, five- and six-bedroom villa exteriors; four-, six- and eight-plex townhouses |
| `03_Gate Cameras` | 6 | Entrance/gate renderings |
| `04_Central Park Cameras` | 20 | Gardens, park, recreation and amenity renderings |
| `05_Community Cameras` | 8 | Community renderings |
| `06_Interior Cameras` | 12 | Three-/four-bedroom townhouse palettes and six-bedroom interiors |
| `07_Landscape Backyard` | 8 | Garden/backyard variants |

The separately received brochure is `C:\Users\surya\Downloads\Brochure\Brochure\Florence Brochure.pdf`: **139 pages, 169,516,927 bytes**. Its SHA-256 is `bc9c83b41c6ca197dfd0856bf237a158f7a60b06e19ff820c6352314c726bdcc`. All page references below mean **physical PDF pages, numbered from 1**, not a printed page number or zero-based index.

The brochure adds written project/developer descriptions, a location map, annotated plans, named housing types, bedroom configurations, amenities and plotted area tables. Those figures are source evidence; receipt of the brochure does not replace Sonia's outstanding confirmation of the commercial offer. Package images are architectural visualisations, not proof of completed construction, current availability or contractual finishes.

## Content map and existing Sanity model

Statuses used below are: **CONFIRMED** = explicitly supported by supplied material (not verification of current availability); **DERIVABLE** = copy or metadata derived from supported facts or existing verified content; **UNCONFIRMED / MISSING** = awaiting Sonia or the stated business decision; **DO NOT PUBLISH** = unsuitable for the current public release.

| Field | Status | Evidence and handling |
| --- | --- | --- |
| Project identity | CONFIRMED | Azizi Florence; `title`, existing slug `azizi-florence`. |
| Developer | CONFIRMED | Azizi Developments; developer profile on p138 says established in 2007. `developer` stays a string. |
| Country | CONFIRMED | United Arab Emirates, confirmed in Haus context and Sharjah location material. `country`. |
| City / emirate | CONFIRMED | Sharjah; p7 and Haus clarification. `city`; never inherit the schema's Dubai default. |
| Community / location | CONFIRMED | Florence alongside Sheikh Mohammed Bin Zayed Road (E311), p7; location map p10. Keep existing `community: Florence`; no invented subcommunity or coordinates. |
| Description | DERIVABLE | Sharjah identity p7, wider community pp8–9, designs and amenities below. Original concise copy maps to `summary` and Portable Text `description`. |
| Property/unit types | CONFIRMED | Wider masterplan includes apartments, villas and townhouses, pp8–9. Detailed villa/townhouse families are documented below. Copy can state this mix; it does not prove apartment specifications or inventory. |
| Primary searchable unit type | CONFIRMED | Each home-type collection has the brochure-supported singular `unitType` of `Villa` or `Townhouse`. The mixed development overview leaves this field absent; no combined enum is introduced. |
| Category | DERIVABLE | Residential, supported by the documented homes; `category: residential`. |
| Bedrooms | CONFIRMED | Villas: four, five or six bedrooms, p36. Townhouses: three or four bedrooms in the configurations below. Set numeric `bedrooms` on each matching home-type collection; leave it absent on the mixed overview. |
| Bathrooms / unit identifiers | UNCONFIRMED / MISSING | No single unit is being offered by this development draft. Do not assign a count or `unitNumber` from one plan to the whole project. |
| Amenities | CONFIRMED | Central-park amenities p17; cluster amenities pp126–127. Use planned wording in `amenities`; no claim that facilities are operational. |
| Key selling points | CONFIRMED | Location, villa/townhouse design choices and planned park/recreation features. Use `keyFeatures`; avoid investment-return or scarcity claims. |
| Completion / handover | UNCONFIRMED / MISSING | No confirmed completion date or delivery commitment. Leave `completionStatus` absent. Planned designs do not justify the schema's completed/off-plan default. |
| Pricing / currency | UNCONFIRMED / MISSING | Sonia's pricing is outstanding. Omit `priceDisplay`, `priceAmount`, `priceCurrency` and rent pricing; do not substitute zero or infer currency from the location. |
| Sizes for the public offer | UNCONFIRMED / MISSING | Brochure plot/sellable figures are recorded verbatim below, with conflicts on pp80/106/118. Sonia must confirm the applicable size definitions and figures. Omit `sizeDisplay` and `plotSizeDisplay`. |
| Payment plan | UNCONFIRMED / MISSING | No confirmed payment plan received. Omit `paymentPlan`; do not copy another Azizi project's terms. |
| Availability / sale-rent intent | UNCONFIRMED / MISSING | Neither designs nor bedroom counts establish current stock, ready/off-plan state or sale/rent intent. Omit `availability`, `listingType`, `listingState` and availability-check dates. |
| Hero media | CONFIRMED | Overview aerial matches p8; five home-type heroes show the matching bedroom/type family. The document-level manifest maps each selection to `featuredImage` only in locally generated output. |
| Gallery / lifestyle media | CONFIRMED | Curated villa, townhouse, entrance, interior and park renders. `gallery`; exact source hashes, dimensions, alt text and comparison notes live in the media manifest. |
| Floor plans | CONFIRMED | Detailed villa/townhouse plan pages listed below. Retain in source material for now; public plan presentation remains undecided. |
| Master plan | CONFIRMED | Aerial visuals plus annotated cluster plans pp12 and 127. The hero is a visualisation, not a substitute for an annotated plan. |
| Location / map | CONFIRMED | Brochure p10. No dedicated map field exists; do not invent travel times or geographical coordinates. |
| Brochure / downloads | DO NOT PUBLISH | The 169.5 MB source PDF stays outside Git. A public download requires a Haus decision and preparation of an appropriate derivative; receipt does not authorise exposure. |
| Video | UNCONFIRMED / MISSING | No video supplied in the inspected folders. Existing `videoUrl` only accepts YouTube/Vimeo; no raw video workflow is needed. |
| Logo / branding | CONFIRMED | Developer/project branding is present in the brochure/render material; no standalone logo asset was identified in the image package. Use existing Haus site branding; do not extract a logo merely to fill a slot. |
| SEO metadata | DERIVABLE | Existing detail page derives title, description, canonical path and social image from `title`, `summary`, `slug`, `featuredImage`. SEO approval is outstanding. |
| Sources / verification | CONFIRMED | Source evidence is documented here and in the manifest; `verification.status` remains `unverified`. Record uncertainties in internal notes, not a public verified badge. |
| QR code | DO NOT PUBLISH | Haus explicitly confirmed none is required for this Sharjah project. Add no QR field or asset. |
| Raw package / duplicate views | DO NOT PUBLISH | Archive originals outside Git; enormous originals and repeated render variations are not public listing assets. |

The existing `property` model supports the overview and five home-type collections without a second content architecture. Each collection describes a brochure-supported family of homes, not a numbered unit or an assertion of available stock. Shared `masterDevelopment: Azizi Florence`, `community`, `city` and `country` values keep them in the existing property taxonomy. Public production inspection found Al Furjan represented by one Apartment document with bedroom variants in features, and Monaco Mansions by one Mansion document; those examples informed the architecture review but do not determine Florence's commercial facts.

The broader filter hierarchy is **Country → City → Area/community**. The clarified examples are `United Arab Emirates → Dubai → Downtown Dubai` and `United Kingdom → London → Canary Wharf`; England may be an optional region, not a replacement for London in the city field. Florence's supported mapping is `United Arab Emirates → Sharjah → Florence`. No additional Florence subcommunity is assigned from unverified assumptions. Wider Country → City filtering remains the separate PR #11 work and must use eligible published Sanity records. A local Florence draft must not add Sharjah to public filter options. The standalone `studio-haus-of-estate/` directory remains untouched.

## Prepared overview and home-type documents

`scripts/azizi-florence.postings.ndjson` contains all six native drafts. The titles for the five collections follow `Azizi Florence — 4-Bedroom Villas` (with the corresponding bedroom count and family); the overview remains `Azizi Florence`. The existing overview-only input and v1 manifest remain available for compatibility.

| Document ID | Slug | Confirmed type / bedrooms | Supporting physical PDF pages |
| --- | --- | --- | --- |
| `drafts.property-azizi-florence` | `azizi-florence` | Mixed development; singular type and bedroom count omitted | Identity/location 7; community 8–9; villa family 36; townhouse configurations 75–118 |
| `drafts.property-azizi-florence-4-bedroom-villas` | `azizi-florence-4-bedroom-villas` | `Villa`, 4 | 36, 60, 61, 64, 65; plans 62–63, 66–67 |
| `drafts.property-azizi-florence-5-bedroom-villas` | `azizi-florence-5-bedroom-villas` | `Villa`, 5 | 36, 51–53, 56–57; plans 54–55, 58–59 |
| `drafts.property-azizi-florence-6-bedroom-villas` | `azizi-florence-6-bedroom-villas` | `Villa`, 6 | 36–38, 42–43, 46–47; plans 40–41, 44–45, 48–49 |
| `drafts.property-azizi-florence-3-bedroom-townhouses` | `azizi-florence-3-bedroom-townhouses` | `Townhouse`, 3 | 75–76, 81–83, 97, 101, 113; configurations include mixed Novoli/Spada rows and all-three-bedroom Tasso |
| `drafts.property-azizi-florence-4-bedroom-townhouses` | `azizi-florence-4-bedroom-townhouses` | `Townhouse`, 4 | 75–76, 88–89, 96, 101, 107, 113; configurations include corner homes and all-four-bedroom Spada rows |

The facts above establish a home type, not the price, dimensions or availability of a specific unit. The full plan and area evidence below remains internal until the outstanding business questions are resolved.

## Brochure evidence and plans

The wider community scale is described on pp8–9 as 30 million sq ft, including a 1.7 million sq ft park. These are master-community statements, not unit or plot sizes, and are not included in the public draft. Page 11 names contemporary clusters Lucardo, Bellarno and Soffiano, and Mediterranean clusters Versilia, Pienza and Siena. Planned hotel and school material appears on pp136 and 137; neither is treated as an operating facility or a confirmed delivery promise.

Park material on p17 includes flower/Zen gardens; running, walking and cycling routes; basketball, tennis and volleyball; children's play, skate and water-play areas; fountains; outdoor theatre; markets/cafes; barbecue/picnic areas; fitness/yoga, pet and mini-golf areas; pools and EV facilities. Cluster material on pp126–127 includes clubhouses, pools, gyms, sauna/steam rooms, jacuzzi, mosques, cafes, barbecue areas, children's play, jogging and EV charging. The draft uses a representative selection with planned wording.

| Design family | Brochure section | Actual plan pages | Bedroom configuration |
| --- | --- | --- | --- |
| 6-bedroom villa Type A | 37–41 | 40–41 | 6 bedrooms |
| 6-bedroom villa Type B | 42–45 | 44–45 | 6 bedrooms |
| 6-bedroom villa Type C | 46–49 | 48–49 | 6 bedrooms |
| 5-bedroom villa Type A | 51–55 | 54–55 | 5 bedrooms |
| 5-bedroom villa Type B | 56–59 | 58–59 | 5 bedrooms |
| 4-bedroom villa Type A | 60–63 | 62–63 | 4 bedrooms |
| 4-bedroom villa Type B | 64–67 | 66–67 | 4 bedrooms |
| Novoli 4-plex | 75–80 | 78–80 | 4, 3, 3, 4 |
| Tasso 4-plex | 81–86 | 84–86 | 3, 3, 3, 3 |
| Spada 4-plex | 87–93 | 91–93 | 4, 4, 4, 4 |
| Novoli 6-plex | 101–106 | 104–106 | 4, 3, 3, 3, 3, 4 |
| Spada 6-plex | 107–112 | 110–112 | 4, 4, 4, 4, 4, 4 |
| Spada 8-plex | 113–118 | 116–118 | 4, 3, 3, 3, 3, 3, 3, 4 |

A plex count is the number of connected homes, not the bedroom count of one home. Render filename suffixes such as `V1` must not be translated into brochure Type A/B without a verified image match.

### Internal area transcription: all 19 rows

These are the brochure's **plot area / sellable area in SQFT**. They are not approved public pricing/size information, not a unit-availability schedule, and not automatically equivalent to built-up area, net area or internal living area. Preserve these figures without silently correcting them.

| # | Design | Position | Bedrooms | Plot area (SQFT) | Sellable area (SQFT) | Physical PDF page |
| ---: | --- | --- | ---: | ---: | ---: | ---: |
| 1 | Villa Type A | Standalone | 6 | 4,843 | 4,949 | 41 |
| 2 | Villa Type B | Standalone | 6 | 4,843 | 4,930 | 45 |
| 3 | Villa Type C | Standalone | 6 | 4,843 | 4,944 | 49 |
| 4 | Villa Type A | Standalone | 5 | 3,767 | 4,635 | 55 |
| 5 | Villa Type B | Standalone | 5 | 3,767 | 4,629 | 59 |
| 6 | Villa Type A | Standalone | 4 | 3,363 | 3,831 | 63 |
| 7 | Villa Type B | Standalone | 4 | 3,363 | 3,714 | 67 |
| 8 | Novoli 4-plex | Corner | 4 | 2,260 | 2,711 | 80 |
| 9 | Novoli 4-plex | Middle | 3 | 1,615 | 2,225 | 80 |
| 10 | Tasso 4-plex | Corner | 3 | 1,938 | 2,354 | 86 |
| 11 | Tasso 4-plex | Middle | 3 | 1,615 | 2,228 | 86 |
| 12 | Spada 4-plex | Corner | 4 | 2,260 | 2,709 | 93 |
| 13 | Spada 4-plex | Middle | 4 | 1,938 | 2,660 | 93 |
| 14 | Novoli 6-plex | Corner | 4 | 2,260 | 2,709 | 106 |
| 15 | Novoli 6-plex | Middle | 3 | 1,615 | 2,224 | 106 |
| 16 | Spada 6-plex | Corner | 4 | 2,260 | 2,717 | 112 |
| 17 | Spada 6-plex | Middle | 4 | 1,938 | 2,663 | 112 |
| 18 | Spada 8-plex | Corner | 4 | 2,260 | 2,718 | 118 |
| 19 | Spada 8-plex | Middle | 3 | 1,615 | 2,225 | 118 |

**Unresolved source conflicts:** the corner-plot drawings on pp80, 106 and 118 show dimensions of 9 m × 20 m (approximately 1,938 sq ft), while their area tables state 2,260 SQFT. Do not replace either source value, average them, select one as correct or turn them into public ranges. Sonia/developer confirmation must resolve the discrepancy and confirm the applicable unit/plot definitions before sizes are published.

## Media selection and exclusions

`scripts/azizi-florence.postings.media.json` is the current v2 source-to-output manifest. Its shared `images` list records SHA-256, byte size, dimensions, output filename, alt text, physical brochure pages and exact-match versus subject-only evidence. Its six `documents` entries assign each hero and ordered gallery explicitly; role/order do not live on shared images. The five home-type entries also carry verified `unitType`, `bedrooms` and brochure references for comparison against the draft input. The earlier `scripts/azizi-florence.media.json` remains a supported v1 overview-only manifest.

The v2 selection contains **22 unique source images**, totalling **686,046,568 bytes**, reused across six documents. The overview preserves all eleven original selections: one main aerial hero and ten gallery images. Each home-type collection has its own hero and four ordered gallery images. Shared park images and the three-bedroom townhouse living image are prepared once and referenced by more than one document. Each alt description identifies an architectural render; a document's hero is not repeated in its gallery.

| Document | Hero image ID | Ordered gallery image IDs |
| --- | --- | --- |
| Development overview | `hero-aerial` | `entrance-day`, `villa-4br-front`, `villa-5br-street`, `villa-6br-front`, `townhouse-front`, `townhouse-garden`, `townhouse-living`, `childrens-play`, `flower-garden`, `cafe-amphitheatre` |
| 4-bedroom villas | `villa-4br-front` | `villa-4br-garden-a`, `villa-4br-garden-b`, `flower-garden`, `cafe-amphitheatre` |
| 5-bedroom villas | `villa-5br-street` | `villa-5br-garden-a`, `villa-5br-garden-b`, `flower-garden`, `cafe-amphitheatre` |
| 6-bedroom villas | `villa-6br-front` | `villa-6br-garden-b`, `villa-6br-living`, `flower-garden`, `cafe-amphitheatre` |
| 3-bedroom townhouses | `townhouse-3br-front` | `townhouse-3br-garden`, `townhouse-living`, `childrens-play`, `flower-garden` |
| 4-bedroom townhouses | `townhouse-4br-front` | `townhouse-4br-garden`, `townhouse-4br-bedroom`, `childrens-play`, `flower-garden` |

Additional visual matches are four-bedroom villa gardens pp61/65; five-bedroom villa gardens pp53/57; six-bedroom villa Type B garden p43 and standalone-villa living area p70; Tasso townhouse front/garden pp82/83; Spada townhouse front/garden pp88/89; and the right-hand typical-bedroom illustration in the four-bedroom townhouse section p96. The six-bedroom interior folder supplies the p70 living image, but its brochure caption is generic to standalone villas, so its public alt text remains generic. The four-bedroom villa hero retains its supported bedroom-family classification without an unverified Type A/B label. Galleries can show alternative designs within a home-type collection; they do not purport to depict one available unit.

The 12K masterplan file alone is 99,156,173 bytes; the main aerial is 70,346,978 bytes, and several park/PNG files exceed 60 MB. Public preparation must resize and compress chosen files; do not place those originals or the 169.5 MB brochure in `public/` or Git. Preserve the entire source package outside the repository.

Near-duplicate render variants need selection even when their file hashes differ. The overview retains the fenced Novoli garden matching p77; the home-type galleries use the unfenced Tasso and Spada gardens matching pp83/89. Other versions remain archived, and render boundary treatments are not contractual commitments. Alternative angles, palettes, oversized PNGs and unused imagery remain source material. The inventory found no byte-identical image duplicates; all 109 files were readable, between 7,680 and 12,000 pixels wide. Both source ZIPs matched the extracted path, size and CRC inventories. A file named `Villa 6BR_V1_Back View Night_8K.jpg` sits inside the 5-BR Villa folder and is excluded pending reconciliation. Image names and folder labels are evidence for sorting, not independent specification authority.

Floor plans, annotated master plans and the location map are not gallery photographs. The current detail gallery crops to 4:3; that can remove plan labels and dimensions. The local utility does not extract, upload or expose them. Any future plan presentation must preserve the whole image and legible labels, follow the shared property model and pass the requested presentation review. The source PDF is not a public brochure download.

## Prepare locally, without importing

This work belongs to existing branch `suryak02/azizi-florence-content-scaffold`, draft PR #12 stacked on editorial-workflow PR #5. Work occurs in an isolated worktree; it does not replace unrelated changes in the integration checkout. No direct-main push, Sanity mutation or production deployment is part of local preparation.

Run from this worktree/repository root:

```powershell
node scripts/prepare-property-media.mjs --manifest scripts/azizi-florence.postings.media.json --draft scripts/azizi-florence.postings.ndjson --source-root "C:\Users\surya\Downloads\OneDrive_2_9-4-2026" --brochure "C:\Users\surya\Downloads\Brochure\Brochure\Florence Brochure.pdf" --output "C:\Users\surya\Downloads\Haus-Florence-postings-prepared"
```

The output must be a new directory outside any Git repository and outside the source directories. The utility rejects an existing output directory; use an already prepared bundle for review, or choose another new path for a fresh run. The v2 output contains 22 optimised JPEGs in `images/`, all six drafts in `properties.staging-draft.ndjson`, and `preparation-report.json`. The utility checks source identities, matches the exact document set and confirmed facts, and assigns local Sanity `_sanityAsset` references. It does not upload assets, authenticate to Sanity, create a dataset, publish or change production. The tracked draft inputs stay free of image references so they do not depend on one user's generated output directory.

To review the prepared bundle, set the explicit local development path in the same PowerShell session and start Next.js bound to loopback:

```powershell
$env:HAUS_PROPERTY_PREVIEW_DIR = "C:\Users\surya\Downloads\Haus-Florence-postings-prepared"
# A disposable local secret prevents NextAuth session warnings; no live credentials needed.
if (-not $env:AUTH_SECRET) { $env:AUTH_SECRET = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N') }
$env:AUTH_TRUST_HOST = "true"
$env:NEXT_PUBLIC_GTM_ID = ""
node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3017
```

Open `http://127.0.0.1:3017/dev/property-previews`, then the overview or a home-type page at `/dev/property-previews/<slug>`. These routes read the explicitly selected local bundle and share the existing property presentation; they do not turn native drafts into public search results. Preview loading requires development mode and the explicit environment setting. Keep this setting out of production configuration. Internal verification notes, source paths, the preparation report and this handoff are not visitor-facing listing copy. Missing commercial data stays unset; preview presentation is not authority to publish an offer.

Do not run `seed-properties.js` or `seed-monaco-mansions.js` as a Florence shortcut: those older scripts configure production writes when a write token exists. Do not run an import command merely because local generation succeeded.

The normal public Sanity client could read production during this audit; a token-free staging query returned HTTP 404, `Dataset staging not found`. That is not evidence of a ready staging environment. Haus must confirm the company-owned project, dataset, access and local/staging preview configuration before any separately authorised staging operation. The CLI's staging default is not proof that the dataset exists.

All six documents retain `drafts.property-*` native IDs, `status: draft`, `featured: false` and `verification.status: unverified`. The overview omits singular `unitType` and numeric `bedrooms`; the five collections set only their brochure-supported unit type and bedroom count. Every document still omits numeric bathrooms, unit identifiers, public price and size fields, availability, sale/rent intent, completion/handover, listing state, availability-check dates, `publishedAt` and editorial approvals. Native publication remains blocked by missing required business fields and the PR #5 editorial gates. These are unresolved facts, not values for the preparation script to fill automatically.

The presentation decision is now represented by an overview plus five home-type collections. Before any separately authorised staging import or publication, obtain Sonia's confirmed commercial facts and resolution of area conflicts; confirm image rights and source facts; verify the company staging target; and follow PR #5's factual/SEO approval and native-publish workflow. Brochure, floor-plan and download exposure also need their stated business decisions. Keep the raw source package and brochure outside Git throughout. No Sanity mutation has been performed by this preparation work.

## Local verification

The current v2 manifest was checked against the source files and the six NDJSON drafts: all 22 image hashes, byte sizes and dimensions, package totals, brochure hash/size, document IDs, slugs, titles and confirmed unit types/bedroom counts agree. Additional selected images were visually compared with the physical PDF pages cited in the manifest. Document heroes and gallery references resolve; no hero repeats within its own gallery, and shared source images have only one output identity. The complete bundle is at `C:\Users\surya\Downloads\Haus-Florence-postings-prepared`. Its 22 JPEGs total **14,100,738 bytes (14.1 MB)**. Shared images used as a hero anywhere fit within 2,560 pixels; gallery-only images fit within 2,000 pixels. All output hashes, dimensions, RGB mode, progressive JPEG encoding and stripped EXIF were independently verified.

Validation on 10 September 2026:

- Preparation suite: **17 passed, one Windows file-symlink privilege skip**; directory-junction escape tests passed. Includes real six-document input, shared image reuse and v1 single-document compatibility.
- Application suite: **40 passed**, including 23 preview loading, production gating, path/hash safety and private-metadata/contact-link projection tests.
- Full TypeScript check, focused ESLint, `git diff --check` and `next build --webpack` passed.
- All six previews and the index reviewed at desktop and 390-pixel mobile width. No horizontal overflow; all assigned gallery images loaded when scrolled into view. Native preview links worked, commercial placeholders remained presentational, enquiry controls were disabled, and robots metadata was `noindex, nofollow` (Google also `noimageindex`).
- HTTP checks against the production build, with the local output setting deliberately present: preview index, detail and media routes each returned **404**; Monaco returned **200**. No local source paths or native import references appeared in those responses.
- Monaco's main HTML, after ignoring React comment markers, matched the original route. Content metadata matched; the only observed metadata difference between compiler runs was Next's internal `next-size-adjust` marker. Public fetching, metadata generation, media dimensions and enquiry links remain unchanged.

The initial Turbopack development run intermittently reported a hydration mismatch after extracting the shared renderer, although its HTTP HTML and Flight output both had correct nesting. The delivered local server uses **webpack**, as in the command above; subsequent preview navigation and reloads were free of that error. A transient header/Radix attribute warning occurred during the compiler switch and did not recur on the clean Monaco reload. No dependency upgrade or suppression was added. Production webpack build and exclusion checks passed.

No Sanity upload, publication, deployment, commit or push was performed. The original dirty integration checkout was preserved. The prepared documents remain drafts awaiting the business facts described above.

### Earlier overview-only preparation

The first preparation run created `C:\Users\surya\Downloads\Haus-Florence-prepared` outside both Git and the original source directories. It contains eleven JPEGs, `property.staging-draft.ndjson`, and `preparation-report.json`. The eleven selected originals total 356,818,202 bytes; their web copies total **7,207,039 bytes** (7.21 MB), approximately 98% smaller. The hero fits within 2,560 pixels and gallery images within 2,000 pixels, without enlargement. Copies use sRGB, progressive JPEG quality 85, and stripped source metadata. A separate contact sheet in the output directory supports review.

All selected source hashes were checked before preparation; all eleven output hashes, dimensions, RGB mode, progressive encoding and absence of EXIF were independently checked afterwards. The gallery contact sheet was visually inspected. The prepared document retains the native draft ID, draft status, unverified state and missing commercial fields; it contains one hero plus ten ordered gallery image references using local `image@file://` Sanity import URIs. No import was executed.

Validation: TypeScript typecheck passed after generating the local Prisma client (no database connection or migration); Sanity schema validation reported zero errors and zero warnings; targeted ESLint passed. The standalone preparation suite runs with `node --test tests/unit/prepare-property-media.test.mjs`: eleven tests passed and one file-symlink test was skipped because this Windows account cannot create file symlinks. Directory-junction escape checks passed. These Node tests are outside the existing Vitest source-test glob.

Those checks describe the earlier overview-only baseline, not a live staging run. In the current six-document set, required `availability` and `listingType` remain missing throughout; `unitType` additionally remains absent from the mixed overview. Schema validation checks the schema definition and does not remove document-readiness gaps. Local preview is now available through the explicit bundle setting above. Live staging import/preview and integrated public Country → City behaviour remain separate work; no live staging verification is claimed.


## Pricing update — 13 September 2026

User supplied two Cluster 1 & 2 summary screenshots and explicitly confirmed all figures are AED. This supersedes earlier notes that pricing is wholly missing. The five home-type drafts now use existing `priceAmount` (starting price), `priceCurrency` and `priceDisplay` fields. Maximum figures and the Cluster 1 & 2 scope are preserved in the display, description and evidence manifest. The overview retains no aggregate price because this is not a complete project inventory.

| Collection | Starting price (AED) | Supplied maximum (AED) |
|---|---:|---:|
| 3-bedroom townhouses | 1,890,000 | 3,017,000 |
| 4-bedroom townhouses | 2,260,000 | 3,418,000 |
| 4-bedroom villas | 3,350,000 | 5,115,000 |
| 5-bedroom villas | 4,200,000 | 6,404,000 |
| 6-bedroom villas | 4,950,000 | 8,205,000 |

Scope: Clusters 1 & 2 only. Screenshot originals are preserved outside Git at `C:\Users\surya\Downloads\Florence-pricing-2026-09-13`; their hashes and currency confirmation are recorded per collection in the media manifest. The screenshots do not state issue/expiry dates, fees, unit availability or a mapping from numbered clusters to named brochure communities. Sizes, payment plan, handover and availability remain unset; all documents remain unpublished, unfeatured and unverified drafts. Palette selections have not changed. Prepared media is reused unchanged; pre-update metadata is backed up under the prepared output's `verification/before-pricing-2026-09-13` folder. No upload, commit or push is included.

Pricing verification: 18 preparation tests passed (one Windows file-symlink privilege skip), 24 local-preview tests passed, and all five detail URLs returned HTTP 200 with their exact supplied AED ranges and cluster scope. Existing optimized images were reused.

## Grouped preview review — 13 September 2026

Following Sonia's feedback, the local index now gives the community overview a full-width feature with the existing aerial, summary and three planned amenities. Separate Villas and Townhouses headings group the five existing home-type links. Short cards show bedroom counts and supplied starting prices; full descriptions and maximum prices remain on each detail page. Group starting prices are derived from the confirmed AED values (villas 3,350,000; townhouses 1,890,000), with Cluster 1 & 2 scope visible. No new property records or public search changes were introduced.

Desktop and 390px mobile browser review passed: six working destinations, all index images loaded, no horizontal overflow, and no captured browser errors. TypeScript, the 24 preview tests and 18 preparation tests passed (the existing Windows file-symlink skip remains). This review changes index presentation only; the previously verified public Monaco renderer and production preview exclusion are unchanged. Source media, brochure and prepared JPEGs remain outside Git. The implementation and evidence are being included in draft PR #12; no Sanity import, publication, production deployment or main-branch push is authorised.
