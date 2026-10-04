# Florence designs and brochure requests - 4 October 2026

Surya authorised a first implementation showing matched property designs, images, floor plans and the two distinct brochure area figures. He explicitly chose public plans and areas, with the full brochure requested separately. Interior scheme choice remains unconfirmed. Use the brochure term **sellable area** until Haus supplies the approved alternative; do not substitute built-up or internal area.

## Content and display

Keep the community overview and five existing bedroom collections. Seven villa brochure designs and twelve townhouse family/row/position combinations sit within those properties. Their keys identify brochure designs, not currently available units. The selected design controls its photographs, plot area, sellable area and whole floor-plan spreads. Townhouse row plans identify multiple connected homes; captions distinguish corner and middle homes and the row's bedroom mix.

Villa brochure Type A/B/C, map facade V1/V2/V3, map mirrored A/B, townhouse family codes and interior Palette A/B are separate concepts. The supplied files do not establish every correspondence. Mediterranean Maggio/Rossa/Corsina designs remain unpopulated because no matched exterior brochure was supplied. Palette comparison does not assert buyer choice, included furnishings or an upgrade price.

Three corner-plot values remain disputed: Novoli 4-home, Novoli 6-home and Spada 8-home rows. New townhouse PDF pp7/33/45 repeat 9m x 20m diagrams against 2,260 sq ft tables. Keep the original values privately in source evidence; omit the disputed numeric plot value from client data and show Awaiting confirmation. Public townhouse plan images contain the ground and first floors, not the conflicting area-summary spreads. Other figures are presented as brochure areas, not verified available-unit specifications.

The already supplied AED collection prices keep their Cluster 1 & 2 scope. They are not prices for each selected design. No new payment, handover or availability claim is added. The payment-plan images reviewed on 2 October are source evidence awaiting current commercial confirmation; the broker pre-launch sheet remains private.

## Preparation and existing architecture

Source: `C:/Users/surya/OneDrive/Documents/hausofestate files`. The prior inventory and page-by-page evidence are in `C:/Users/surya/Downloads/Florence-brochure-review-2026-10-02/Florence-variant-plan.md` and `docs/azizi-florence-ingestion.md`.

`scripts/azizi-florence.variants.json` maps PDF hashes/pages, designs, areas and selected media. `scripts/prepare-florence-variants.py` prepares a new bundle outside Git from the existing six-document bundle. Originals and the previous output are preserved. The source PDFs are not copied into public assets or committed. Reusable brochure images are rendered once and shared; floor plans retain their full framing.

The local bundle's optional `variants.json` extends the existing preview workflow. The reader allows only listed, assigned JPEG assets, validates paths and image hashes, and projects display fields without source paths, raw PDF references or private evidence. Older bundles continue to work. Previews remain development-only, noindex and excluded from public search.

The existing Sanity `property` schema gains optional design and interior arrays. The existing detail query and renderer use them; records without designs retain their original presentation. No parallel property database or Florence-specific search architecture is introduced. No Sanity import is performed. Before a later import, reconcile the native UUID draft identities documented in `docs/florence-sanity-import-2026-09-14.md`; do not import historical NDJSON IDs blindly.

## Brochure request boundary

The request button uses the existing enquiry flow and records the collection and selected design in the enquiry message. This is request capture, not automatic brochure fulfilment. Existing server-side property resolution, durable submission receipt and delivery handling remain authoritative. The selected design text is visitor enquiry context, not a server-verified inventory selection.

Full PDF URLs are absent from the public presentation. There is one brochure per villa bedroom collection and a combined 3-/4-bedroom townhouse brochure; do not promise a separate PDF for every design. Marketing choices remain separate and optional. Preview submission is disabled. No application or customer emails are sent in testing.

The local presence-only check found no configured `DATABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` or `LEAD_NOTIFICATION_TO`. No automatic customer brochure transport is activated. Remaining activation work: approved customer PDF revisions and hosting/access policy; server-resolved brochure mapping; distinct durable customer-email delivery job; configured database/sender/worker; and a controlled delivery test with actual recipient inbox receipt. A successful enquiry receipt must never be presented as proof that the brochure was emailed.

## Ownership

Release 2 / `suryak02/azizi-florence-content-scaffold` / draft PR #16. No production deployment, Sanity mutation, campaign send, main-branch commit or push. Preserve unrelated handoffs, assets and the existing dirty tsconfig.

## Prepared result and verification

Output: `C:/Users/surya/Downloads/Haus-Florence-variants-prepared-2026-10-04`. Six existing property drafts, nineteen designs, four bedroom-specific palette comparisons, and 56 new JPEG assets (32,570,629 bytes), alongside the existing 22 images. Whole plans use a maximum 2,560-pixel edge; standard brochure photograph margins are removed. The PDFs remain private and no payment-plan or broker-launch document is copied into the bundle.

Reproduce with Python containing Pillow and pypdfium2:

```powershell
python scripts/prepare-florence-variants.py --source-root 'C:/Users/surya/OneDrive/Documents/hausofestate files' --base-bundle 'C:/Users/surya/Downloads/Haus-Florence-postings-prepared' --output '<new directory outside Git>'
$env:HAUS_PROPERTY_PREVIEW_DIR='C:/Users/surya/Downloads/Haus-Florence-variants-prepared-2026-10-04'
npm run dev -- --hostname 127.0.0.1 --port 3017
```

`properties.staging-draft.ndjson` retains the existing single/multiple-document preview contract. The separate `properties.variants.staging-draft.ndjson` includes native Sanity image import references, optional design fields, source hashes and private discrepancy evidence. It is a preparation candidate, not an approved replacement of current Studio records: reconcile native draft IDs and later edits before import.

Verified locally:

- TypeScript, scoped ESLint, Sanity schema validation (zero errors/warnings), and 49 focused preview, shared-detail and brochure-capture tests passed. Existing lead receipt/service/persistence tests also passed; no real submission was sent.
- All 56 new image hashes, dimensions, unique IDs and design references checked. Original PDF hashes are checked before preparation; output refuses existing folders and paths overlapping inputs or the repository.
- Ten synthetic Python preflight tests passed, covering existing-output preservation, input/repository overlap, traversal, linked directories, source-hash mismatch and invalid interior pages before any output is written.
- All six pages loaded at desktop and 390px mobile width without horizontal overflow. Villa A/B switching changed the matched images/plans and 3,831 to 3,714 sq ft sellable area. Spada six-home middle selection showed 1,938 plot / 2,663 sellable sq ft; disputed Novoli corners showed no numeric plot figure. Palette B loaded its matching bedroom illustration.
- Plans open as full JPEG spreads in a new tab. Preview metadata is noindex/nofollow, brochure buttons are disabled, and no full-PDF link is exposed. Production exclusion remains covered by tests.
- Monaco loaded its original hero, facts and gallery; shared-renderer regression tests cover non-variant properties. Sanity Live reports that this local origin is not CORS-allowed; server-rendered public content still loaded, and no remote CORS configuration was changed.
- Repeated media requests share validated metadata, while each image still undergoes path and byte/hash checks. Metadata changes invalidate the development cache; tampered-image and cache-invalidation tests pass.

Local screenshots are in Downloads as `florence-villa-designs-2026-10-04.png` and `florence-mobile-palette-2026-10-04.png`. No production build, hosted delivery, customer email receipt or publication is claimed.
