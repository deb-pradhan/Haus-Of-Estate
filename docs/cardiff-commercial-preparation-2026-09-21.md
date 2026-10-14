# H21 — Cardiff commercial premises, 21 September 2026

This work belongs to cumulative Release 2. It prepares only the three premises
matched to Sonia's supplied screenshot and Hafren's current advertisements.
Publication and production deployment remain separate. The unidentified warehouse
has not been imported, and Florence remains paused.

## Matched sources and commercial facts

| Source | Rent advertised on 21 September | Headline floor area | Access | Prepared slug |
| --- | --- | --- | --- | --- |
| [HP-37595-property](https://www.hafrenproperties.co.uk/property/1250-pcm-a1-a3-ground-floor-commercial-unit-in-city-road-roath-cardiff-cf24-3bp/) | £1,250 per calendar month | 285 sq ft / approximately 26.48 m² | Tavistock Street | `city-road-cardiff-commercial-unit-285-sq-ft` |
| [HP-37590-property](https://www.hafrenproperties.co.uk/property/1500-pcm-a1-a3-ground-floor-commercial-unit-in-city-road-roath-cardiff-cf24-3bp/) | £1,500 per calendar month | 240 sq ft / approximately 22.30 m² | City Road | `city-road-cardiff-commercial-unit-240-sq-ft` |
| [HP-37584-property](https://www.hafrenproperties.co.uk/property/2000-pcm-a1-a3-ground-floor-commercial-unit-in-city-road-roath-cardiff-cf24-3bp/) | £2,000 per calendar month | 325 sq ft / approximately 30.19 m² | City Road | `city-road-cardiff-commercial-unit-325-sq-ft` |

All three are ground-floor commercial premises in Roath, Cardiff CF24 3BP. Their
source pages returned HTTP 200 and still advertised these figures when checked
at 09:01 UTC on 21 September. This proves what was advertised, rather than fresh
confirmation from the letting agent that each premises is still available.

The existing schema is reused: `category: commercial`, `availability: [ready]`,
`listingType: [rent]`, `unitType: Retail Unit`, GBP monthly rent, and original
display wording. `ready` distinguishes an existing property from off-plan; it
does not claim a finished interior. The source photos visibly show fit-out work.
Copy makes condition, fit-out requirements, suitability and current availability
subject to confirmation. No completion-status label is invented.

The source's internal area figures differ from every headline by five sq ft:

| Source | Shop floor | WC | Component total | Headline |
| --- | --- | --- | --- | --- |
| HP-37595-property | 260 sq ft / source 24 m² | 20 sq ft / source 1.85 m² | 280 sq ft | 285 sq ft |
| HP-37590-property | 215 sq ft / source 20 m² | 20 sq ft / source 1.85 m² | 235 sq ft | 240 sq ft |
| HP-37584-property | 300 sq ft / source 28 m² | 20 sq ft / source 1.85 m² | 320 sq ft | 325 sq ft |

Both sets are preserved in the draft description/review notes; no area is silently
corrected. Total metric figures are derived using 0.09290304 m² per sq ft and
labelled approximate, rather than presented as a new survey.

The source mentions a new lease with terms to agree, availability from 15 May
2026 and EPC TBC. The commercial-use wording is the agent's description, not a
planning certificate. Lease details, current EPC, VAT, business rates, deposit,
service charges and other charges remain to be confirmed. No street/building
number or Unit A/B/C identity is given. In particular, the shared postcode does
not identify any of these as Haus's Unit A office. Bedrooms, bathrooms, unit
number, developer, sale price and current active-listing verification are omitted.

## Photos and branding

Nine photo associations represent **seven unique original JPEGs**: the shared
exterior is used by all three listings, followed by three, two and one separate
interior photos respectively. All seven unique photos were visually inspected.
Original bytes and the physical Hafren sign in the exterior remain intact.

| Prepared gallery | Source dimensions, in gallery order |
| --- | --- |
| HP-37595-property | 1439×1200, 1600×1200, 1200×1600, 1600×1200 |
| HP-37590-property | 1439×1200, 1200×1600, 1200×1600 |
| HP-37584-property | 1439×1200, 1200×1600 |

The shared exterior is the featured image for each. Descriptive alt text distinguishes
the street access and interiors during fit-out. `showHausLogo: true` opts these
three records into the website's separate Haus logo overlay; no logo is baked
into the source photographs. Sonia's forwarded instruction supplied the source
and requested Haus branding; the photo preparation follows that instruction.

## Preparation and verification

- [Reviewed source payload](../scripts/data/cardiff-commercial-2026-09-21.json).
- [Create-only importer](../scripts/prepare-cardiff-commercial.mjs), read-only by default.
- [Import guard tests](../scripts/prepare-cardiff-commercial.test.mjs).
- Local source images, hashes, alt text and original URLs:
  `.git/cardiff-commercial-2026-09-21/media-manifest.json` and `assets/`.
- Source/CMS comparison before preparation: `.git/sanity-cardiff-review-2026-09-21.json`.

Initial read-only preflight (it now deliberately refuses because these three
source/slug matches exist; it is not an existing-record verification command):

```powershell
node node_modules/@sanity/cli/bin/run.js exec scripts/prepare-cardiff-commercial.mjs --with-user-token
```

The importer accepts only these three sources and rejects existing source/slug
matches. It asks Sanity to generate native draft IDs using `_id: 'drafts.'`, with
no deterministic document IDs. Media must pass visual-review, path, hash, format,
dimensions and source-association checks before an upload. Automated mutation
retries are disabled. A persistent execution marker stops blind reruns after an
uncertain response. It creates documents only; it cannot patch, replace or publish
an existing document.

All 11 existing property documents and eight protected blog draft/published
documents are recorded before creation and checked by full revision identity
afterwards. The matched property drafts use `status: draft`, `featured: false`,
`verification.status: unverified`, false editorial approvals and no `publishedAt`.
The protected set includes all six paused Florence drafts and both H01
draft/published pairs.

Five importer guard tests passed. Both the prepared three-document NDJSON and
the three records read back after import passed the current Sanity document
validation with no errors or warnings. Focused importer/test lint also passed.

The website logo-overlay change was separately checked by the main task:
10 property tests, six SEO checks, TypeScript and focused lint passed; Sanity
schema validation returned zero errors/warnings; the production build completed
with 79 static pages. Desktop and 390/312 CSS-pixel mobile detail hero/gallery
fixtures showed the overlay without horizontal overflow. Those are component
fixture checks, not an authenticated CMS preview or evidence of live deployment.

## Saved draft receipt

Created and verified at **21 September 2026, 09:16 UTC** in
`jdxbkry4 / production`, transaction `pcT5cUTM5ohqBnZd4q3WxR`:

| Advertised premises | Native draft ID | Gallery photos |
| --- | --- | --- |
| 285 sq ft / £1,250 pcm | `drafts.pcT5cUTM5ohqBnZd4q3WyG` | 4 |
| 240 sq ft / £1,500 pcm | `drafts.pcT5cUTM5ohqBnZd4q3Wz5` | 3 |
| 325 sq ft / £2,000 pcm | `drafts.pcT5cUTM5ohqBnZd4q3Wzu` | 2 |

The full saved content matches the submitted drafts after excluding Sanity's
system fields. All seven unique uploaded assets resolve. A separate fresh query
confirmed **three Cardiff native drafts and zero published Cardiff twins**,
**six Florence drafts and zero published Florence twins**, and 14 total property
documents. Every one of the 19 protected existing document revisions is unchanged,
including the H01 corrections and H08 cover drafts/published counterparts.

Local evidence is under `.git/cardiff-commercial-2026-09-21/`:
`protected-before.json`, `submitted-drafts.json`, `receipt.json`,
`created.validation.ndjson` and `verification.json`. The receipt maps each source
photo URL and hash to its Sanity image asset. Published content was not changed.
The records can be reviewed in Studio; they are not public website listings.
Repeating the importer now stops on the existing source/slug match instead of
creating a duplicate or overwriting an editor's work.

## Remaining business confirmation

Before any separate publication decision, confirm current availability, condition,
measurements, lease and other commercial terms. The existing content/SEO approval
workflow remains in place. The warehouse needs an exact source/identity before
it can be matched; the current taxonomy does not include Warehouse. No candidate
has been substituted or imported by guesswork.
