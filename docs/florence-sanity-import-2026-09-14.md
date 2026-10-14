# Florence content in Sanity — 14 September 2026

Surya explicitly requested uploading the prepared Florence properties to
Sanity and confirmed the amenities are already present. Public summaries,
descriptions, features and amenities now use present-tense copy. Prices,
property classifications, image choices and the accepted document structure
are preserved. Unknown unit availability, sizes and handover details were not
invented. Internal verification notes record the dated confirmation.

The existing project `jdxbkry4`, dataset `production`, now contains six new
native drafts, with 22 image assets uploaded from the verified 14.1 MB local
preparation bundle. All hero/gallery references resolve. All three pre-existing
property document IDs and revisions were unchanged after import. No property
was published, replaced or deleted.

Open **Properties → Draft** or **Properties → All Properties** in
[the local Studio](http://localhost:3333/structure/properties;allProperties).

| Entry | Native draft ID |
| --- | --- |
| Azizi Florence overview | `drafts.9405e5db-9b61-4fd7-bb26-ef4f89eb71c8` |
| 4-bedroom villas | `drafts.0f23c71e-459d-4e00-81c3-2dfab801c247` |
| 5-bedroom villas | `drafts.413a49b8-c0f4-4e11-8e37-2c42095281cb` |
| 6-bedroom villas | `drafts.5c86a687-3e2f-40d9-aa03-7ff580313158` |
| 3-bedroom townhouses | `drafts.08e9b9ea-74ba-4b61-90b5-5ec54a9cfc47` |
| 4-bedroom townhouses | `drafts.09828cf9-b9d5-409f-8e4a-658fcdaa75a6` |

Random native draft IDs avoid treating source IDs as production identities.
The local receipt retains the mapping from prepared IDs to imported IDs.
The source NDJSON files and preview bundle keep their original source IDs.

## Verification and recovery

### Classification follow-up

Surya confirmed off-plan status after the import. All six actual Sanity drafts
now have `availability: ["off-plan"]` and `listingType: ["sale"]`. The overview
uses the additive `Development` type; the five home collections keep their
Villa/Townhouse types. Revision-guarded patches preserved all other fields and
assets. Status and approval fields remain unchanged; nothing was published.
The mutation receipts are in `.git/florence-sanity-classification-2026-09-14/`.
Historical source/preparation bundles are retained unchanged.
Final validation of all six amended Sanity documents: zero errors, zero warnings.

### Original import recovery

`scripts/import-florence-drafts.mjs` is restricted to these six Florence slugs
and checks all 22 file hashes before uploading. It creates native drafts in
one transaction and never replaces an existing document. Its default mode is
read-only. Run through `sanity exec ... --with-user-token`; the CLI supplies the
signed-in account's credential without writing it into project files.

The canonical checkout's `.git/florence-sanity-import-2026-09-14/` contains the
preflight snapshot, exact uploaded source, receipt, asset IDs and postflight
verification. Preserve that receipt before retrying an uncertain operation.
If matching documents exist without a recognised local receipt, the script
stops rather than modifying them or creating duplicate entries.

```powershell
$env:HAUS_FLORENCE_IMPORT_BUNDLE = 'C:\Users\surya\Downloads\Haus-Florence-postings-prepared'
npx.cmd sanity exec scripts/import-florence-drafts.mjs --with-user-token
```

The completed import used `HAUS_FLORENCE_IMPORT_EXECUTE=true`. Do not use the
importer to publish or fill missing commercial fields. The Studio's editorial
validation still applies before publication. The website's ordinary property
catalogue reads published content; the local Florence demo remains at
`/dev/property-previews` until publication is separately authorised.

## Snagging service

The earlier services notes described snagging, but no dedicated service had
been implemented. Release 2 now includes `/snagging`, a Services section,
desktop/mobile menu and footer links, and sitemap/analytics route coverage.
WhatsApp and email CTAs prepare an editable quote enquiry containing property
type, bedrooms, area and units, floors, location and handover details. There is
no invented rate card, inspection guarantee or turnaround promise.

Verification: desktop and Pixel 7 browser checks, TypeScript, changed-file
ESLint, and six SEO/analytics checks passed. No enquiry message was sent.
