# H22 — Manchester property preparation, 21 September 2026

Prepared for cumulative Release 2 / PR #16, using Sonia's 19 September
instruction and [Rightmove listing 93277344](https://www.rightmove.co.uk/properties/93277344).
Publication is separate. Cardiff's three existing drafts are retained; Florence
remains paused. No other property or entire agency catalogue is imported.

## Listing and source review

The source advertises a two-bedroom, one-bathroom terraced house on Sherrington
Street, Manchester. Its brochure identifies **22 Sherrington Street, M12 5RW**.
The draft uses ready residential / for sale, leasehold, approximately 67 m² /
722 sq ft as advertised, a reception room, fitted kitchen, downstairs WC,
upstairs bathroom, rear yard and on-street parking. `Terraced House` is added to
the shared residential taxonomy, which also supplies Studio/search/AskHaus.

The copy is written for Haus. The source agency's promotional paragraphs, phone,
email, logo, brochure and map are not included in public-facing listing fields.
Source links and review issues are retained in internal verification notes.

| Issue | Prepared treatment / outstanding confirmation |
| --- | --- |
| Sonia: **£219,995**; current advert and brochure: **offers over £195,000** | Draft follows Sonia's explicit price, without the source's offers-over qualifier. Sonia/Haus listing owner must resolve the discrepancy before publication. |
| First Rightmove photo centres on neighbouring number **20**; brochure names **22** | First photo excluded. The red-brick house in photo 17 matches the house centred in the brochure and is the draft hero. Confirm address/photo identity before release. |
| Council Tax A in advert and brochure page 1, but B on page 2 | No tax band asserted in the draft. |
| Headline 722 sq ft / 67 m²; prose 721 sq ft | Approximate advertised headline retained; no measured-area claim. |
| Prose repeats 4.43 × 1.98 m for reception and kitchen; ground-floor plan instead shows 5.00 × 3.10 m and 5.20 × 1.98 m | Room dimensions and both floorplans held outside the CMS gallery pending confirmation. |
| Longsight in features, Levenshulme in prose | Community field uses Sherrington Street; no disputed neighbourhood claim. |
| Leasehold, but no remaining term, ground rent or service charges | Leasehold disclosed; terms to confirm. No zero-charge assumption. |
| Source EPC graphic D/65, potential B/88 | Full dated certificate not supplied; graphic retained as internal source evidence, not presented as a verified current certificate. |
| Live source advert | Evidence of advertised content only; current availability, condition and sale terms still need the listing owner's confirmation. |

Source brochure:
<https://media.rightmove.co.uk/property-brochure/df60facf1/93277344/df60facf1529d60b74593b4570d09b4e.pdf>.
Both pages were downloaded, rendered and inspected, as were all 19 source photos,
two floorplans and the EPC image.

## Images

Eighteen original JPEG photographs are selected, with descriptive alt text.
The excluded first photo and three non-photographic source images remain in the
local source archive. No visible Rightmove or agency digital watermark was found
in the original photographs; no image removal, retouching or generated replacement
was needed. Physical features, condition, street scene and neighbouring properties
remain unchanged. `showHausLogo: true` opts into the existing separate website
overlay; it does not overwrite the source pixels.

Photos are 1024×768 except the portrait hero at 919×1024. The source's excluded
lead photo is 1024×810. No artificial upscaling is performed.

The supplied Cardiff screenshot was independently matched again to the existing
£1,250/285 sq ft, £1,500/240 sq ft and £2,000/325 sq ft drafts. A fresh authenticated
read confirmed all three retain their original revisions, nine gallery associations,
resolving assets, `showHausLogo: true` and zero published twins. Their exterior
contains a physical Hafren sign; that sign remains part of the unedited photograph.
The warehouse still needs an exact advert or address from Sonia; the screenshot
does not identify it.

## Preparation and verification

- Reviewed payload: `scripts/data/manchester-sherrington-2026-09-21.json`.
- Create-only importer: `scripts/prepare-manchester-sherrington.mjs`.
- Source HTML, original media, hashes, brochure and rendered review pages:
  `.git/manchester-sherrington-2026-09-21/` (local, untracked evidence).
- Authenticated Cardiff recheck: `.git/cardiff-reread-after-status-fix-2026-09-21.json`.
- The importer defaults to read-only. New documents use a Sanity-generated native
  draft ID, never a source-derived identifier. It refuses an existing matching
  slug/source/title, retains a persistent execution receipt and disables mutation
  retries. All existing property and post revisions are protected.
- Draft approvals remain false, verification unverified, featured false, with no
  publishedAt or inferred completed status. No source conflicts are silently resolved.

## Saved draft receipt

Authenticated import/read-back completed **21 September 2026, 12:41:44 UTC**:

- Project/dataset: `jdxbkry4 / production`.
- Native draft: `drafts.pcT5cUTM5ohqBnZd4qKwld`.
- Slug: `sherrington-street-manchester-two-bedroom-terraced-house`.
- Transaction: `pcT5cUTM5ohqBnZd4qKwko`.
- One native draft, **zero published twins**, eighteen resolving original image
  assets. Full read-back content equals the submitted draft.
- All **48 pre-existing property and post documents** retain identical revisions,
  including the six paused Florence drafts, three Cardiff drafts, held blog covers
  and H01's already-corrected published records and separate drafts.
- Receipts: `.git/manchester-sherrington-2026-09-21/receipt.json` and
  `verification.json`; full before snapshot and submitted/read-back records retained.

Four import safety tests passed; focused ESLint, TypeScript, ten existing
property/AskHaus tests and Sanity schema validation passed. Prepared document
validation returned zero errors/warnings when explicitly targeting production.
The initial CLI default selected a nonexistent staging dataset and failed its
read-only slug check; rerunning with `--dataset production --project-id jdxbkry4`
resolved that configuration error. No dataset was created or changed.

The saved record also passed document validation with **zero errors/warnings**:
`sanity documents validate --file .git/manchester-sherrington-2026-09-21/created.validation.ndjson --dataset production --project-id jdxbkry4 --yes --format json`.

This is saved-content and code validation, not evidence of a public Manchester
page, fresh production build/deployment or current agent availability confirmation.
