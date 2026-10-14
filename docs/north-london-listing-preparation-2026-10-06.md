# North London property: private listing draft

Prepared 6 October 2026 for Surya's requested 7 October review; updated 11 October with Sonia's WhatsApp clarification and the actual floor-plan image supplied by Surya. This is local preparation on Release 2 / draft PR #16, not a public advert or Sanity upload.

## Supplied evidence

- Haus Marketing's 2 October email, **Images for a property listing in North London** (`1a0fc0570afd32f4`), confirms **North London, three bedrooms, for sale**. These facts do not establish current inventory, the exact identity or publication approval.
- The forwarded 30 September **Interior Design Visuals – Property Transformation Proposal** (`1a0f2c329e8d0f2b`) describes AI-assisted initial concepts. The images marked AFTER show proposed interiors, not completed renovation works.
- Five original boards were downloaded from the supplied 2 October email, visually inspected and hashed. Original files and a source receipt remain outside Git at `C:/Users/surya/Downloads/Haus-North-London-source-2026-10-06`.
- The original email text did not establish price, property type or ready status. Sonia's **7 October 20:50/20:54 WhatsApp messages**, supplied by Surya on **11 October**, now confirm **GBP 500,000 asking price, three bedrooms, terraced property and ready property**. These supersede the earlier gaps. The later floor-plan attachment below also establishes the stated internal area and depicted room arrangement.
- Sonia explicitly says **no road name or postcode** on the public listing. Retain the broad North London / London location. Hackney was mentioned in Surya's question but is not independently confirmed by Sonia's response. Do not derive a precise map pin or treat the email-signature office address as the property address.
- Sonia said she was sharing a floor plan. The **7 October 20:53 BST email** (`1a117edfd32c68e9`) matches her message timing but contains the forwarded concept images, with no floor-plan document or link. The bounded Gmail search on 11 October found no separate plan. **This search limitation is now superseded:** Surya subsequently supplied the actual plan image in this chat, which has been visually inspected.

### Floor plan supplied on 11 October

- Original preserved outside Git as `north-london-floor-plan-2026-10-11.png` in the source directory above: **1,169 × 1,983 pixels**, **406,944 bytes**, SHA256 `8d85661d32e054dd0dd674cbb3f651fdca495cbe4845a50aca93bd7be571524f`.
- Printed measurement: **Approx. Gross Internal Floor Area: 889.9 sq ft / 82.67 m²**. Both values are retained exactly. This is internal floor area, not plot area, and is not relabelled with Florence's built-up-area terminology.
- The drawing shows **three bedrooms and one bathroom upstairs**, and a **living room, kitchen and separate WC downstairs**, plus a front garden and backyard. A separate WC does not make this two bathrooms. The stated front-garden dimensions do not establish total plot size.
- The complete image and its printed disclaimer remain visible: measurements are approximate and for guidance only; the plan states that areas were calculated in accordance with Property Measurement Standards. No independent measurement verification is implied.
- Show this as a separate **Floor plan** section with an uncropped image and full-size link, not inside the proposed interiors gallery. The source contains no road name or postcode.

## Prepared content

Existing `property` document, native draft ID `drafts.property-north-london-three-bedroom`, temporary slug `north-london-three-bedroom-property`. Reconcile the title/slug against the confirmed identity before publication. `status: draft`, `featured: false`, verification unverified. Country/city use **United Kingdom → London**; North London remains a broad provisional area, not a guessed neighbourhood.

Source draft: `scripts/north-london.staging-draft.ndjson`. Media assignment and hashes: `scripts/north-london.media.json`. The draft now uses `unitType: Terraced House`, `bedrooms: 3`, `listingType: [sale]`, `availability: [ready]`, `priceAmount: 500000`, `priceCurrency: GBP` and `priceDisplay: £500,000`. Ready is the existing property-status taxonomy; it does not establish vacant possession, available inventory or completed renovation work. Keep `completionStatus` unset rather than using it to describe the proposed works. The draft now includes the plan-sourced approximate gross internal area in `sizeDisplay`, with the depicted bathroom and separate WC described in copy. No numeric bathroom-total field, total plot area, tenure or energy information is invented. The presentation calls the image section **Proposed interiors**.

| Selected board | Use | Interpretation |
|---|---|---|
| Living/dining space 02 | Hero | Supplied existing views beside proposed AI interiors |
| Living/dining space 01 | Gallery | Comparison/design board; top-down illustration is not a measured floor plan |
| Kitchen before after | Gallery | Proposed concepts only, despite its filename |
| Master toilet | Gallery | Supplied existing view beside proposed bathroom concept; no claim of en-suite status |
| Common toilet | Gallery | Comparison/design board; no bathroom-count claim |
| Supplied floor plan | Separate floor-plan section | Ground and first floors; approximate gross internal area and disclaimer retained |

All boards stay uncropped with visible explanatory captions. The added floor-plan derivative is **113,054 bytes**, keeps the original **1,169 × 1,983** dimensions, and includes the entire plan and disclaimer. The six-image bundle totals **1,528,775 bytes**. The original views have not been independently verified as current. Five JPEG derivatives total **1,415,721 bytes**, down from **11,134,953 bytes** of PNG sources; original dimensions retained without enlargement, quality 85, progressive sRGB, metadata stripped.

Latest import file and images: `C:/Users/surya/Downloads/Haus-North-London-floorplan-prepared-2026-10-11`. The earlier confirmed-price bundle at `C:/Users/surya/Downloads/Haus-North-London-prepared-2026-10-11` is also preserved. The 6 October bundle and original files remain intact. This is an importable local draft bundle, not an upload receipt. Its evidence record and originals remain private. Never commit the bundle or raw boards.

```powershell
node scripts/prepare-property-media.mjs --manifest scripts/north-london.media.json --draft scripts/north-london.staging-draft.ndjson --source-root 'C:/Users/surya/Downloads/Haus-North-London-source-2026-10-06' --output '<new-empty-output-directory-outside-git>'
```

The preparation tool accepts version 3 email evidence, verifies evidence/image hashes and concept labels, and rejects this draft's unconfirmed fields. The optional `confirmedDetails` manifest entry records the later user-supplied message provenance and permits only the matching property type, ready status and GBP price; old bundles still work. Optional `floorPlanImageIds` assigns a hash-verified plan separately from hero/gallery images. `confirmedMeasurements` permits only a matching `sizeDisplay` linked to an assigned source plan; it does not unlock plot sizes or other unconfirmed facts. Prepared drafts use the existing property model with an optional top-level `floorPlans` image array; Florence's design-specific plans remain unchanged. Original email source evidence is unchanged. Version 1/2 Florence workflows remain supported. The existing local preview loader and shared detail renderer support individual property drafts; production preview routes remain unavailable, local pages are noindex, and property enquiry/save/share actions are disabled.

Local review: `http://127.0.0.1:3018/dev/property-previews/north-london-three-bedroom-property`. Server uses `HAUS_PROPERTY_PREVIEW_DIR` pointing to the London bundle and `HAUS_NEXT_DIST_DIR=.next-london-preview`. Florence's 3017 server and prepared bundle are untouched.

## What Sonia/Haus must supply before publication

1. Confirm the property identity internally and current sale instruction. Public location remains area/city only, without a road name, postcode or precise map pin. Confirm Hackney separately if Haus wants that neighbourhood shown.
2. Tenure and any applicable lease length, service charge, ground rent or other relevant charges; council-tax band. Asking price is now confirmed at £500,000; no offers-over or guide-price qualifier was supplied.
3. Valid EPC/rating, applicable exemption, or evidence an EPC has been commissioned before marketing where required.
4. Current-condition photographs, ideally including the exterior; confirmation that supplied existing panels accurately represent this property. Approve image rights and the clear separation between existing views and concepts.
5. Total plot area, occupancy, and other material property information relevant to the enquiry/viewing decision, including any known issues. The plan and its approximate gross internal floor area have now been supplied; the drawing shows one bathroom and a separate WC. Do not confuse the separately supplied AI furniture diagrams with this floor plan.
6. Owner/Haus approval of the particulars and publication; clarify whether any actual works are proposed, included or approved. AI designs establish none of these.

The newly confirmed `unitType` and `availability` now satisfy those schema fields. This does not establish overall publication readiness or create a second property model. Energy/tenure and other verified UK particulars may require structured schema/presentation additions once supplied.

**Additional publication limitation:** public search/homepage cards and social preview image generation currently crop images and do not display concept captions. Before using a concept as a public hero, update those surfaces or choose a verified current photograph as the hero. Detail-page and local-preview captions alone do not solve this.

## Floor-plan and advertising guidance checked

No blanket floor-plan requirement was found in the official guidance reviewed. The government's June 2026 [home-buying reform roadmap, Annex B](https://www.gov.uk/government/consultations/home-buying-and-selling-reform/outcome/home-buying-and-selling-reform-roadmap#annex-b-sales-pack-information) includes floor plans in proposed future sales packs, subject to legislation. This was the guidance recorded during the earlier missing-plan audit; the actual plan has since been supplied. A plan alone does not establish all material particulars.

The current [CMA unfair-commercial-practices guidance](https://www.gov.uk/government/publications/unfair-commercial-practices-cma207/unfair-commercial-practices) addresses material omissions under DMCC provisions effective 6 April 2025. Pending labels are not a substitute for assessing the facts a buyer needs. Do not describe the older NTSELAT Parts A/B/C as a current binding statutory checklist; the [current NTS page](https://www.nationaltradingstandards.uk/work-areas/estate-agency-team/material-information/) points to the 2026 reforms and replacement guidance remains a separate matter.

[Official EPC guidance](https://www.gov.uk/government/publications/energy-performance-certificates-for-the-construction-sale-and-let-of-dwellings/a-guide-to-energy-performance-certificates-for-the-marketing-sale-and-let-of-dwellings) says that, unless exempt, an EPC must be commissioned before marketing if none is valid; agents must be satisfied this happened. Reasonable efforts must secure it within seven days, with a further 21 days only if unsuccessful. Commercial adverts must include the energy rating where available.

[ASA AI-advertising guidance](https://www.asa.org.uk/news/disclosure-of-ai-in-advertising-striking-the-balance-between-creativity-and-responsibility.html) warns that disclosure cannot cure a misleading overall impression. Keep concepts clearly labelled, alongside verified current photographs; do not imply actual geometry, fitted features or completed work without evidence. Haus should confirm the final advert's particulars with the responsible agent.

## Verification

### 14 October navigation and sidebar update

- Removed the unconfirmed EPC and Tenure placeholder rows from the individual-property preview sidebar at Surya's request. Internal evidence and publication requirements remain recorded above.
- Every property detail now has a top-left breadcrumb: Home → Properties → current property. Local drafts include the draft-preview index; Florence home collections also link to their community overview. Links reuse existing routes and do not add unpublished drafts to the public catalogue.
- All 14 shared-detail regression tests, TypeScript and scoped ESLint passed. Coverage includes public Monaco navigation, London draft navigation/placeholder removal, Florence parent navigation and floor-plan rendering. Browser review remains unverified because access to the local preview was previously blocked by browser security policy.

### 12 October floor-plan update

- Prepared one native draft and six JPEGs, including the complete supplied plan. Verified source/output hashes, dimensions and local import references; visually inspected the uncropped derivative and its printed disclaimer. Originals and earlier bundles remain outside Git.
- Preview loader and shared renderer: **61 tests passed** (47 + 14). Media preparation: **25 tests passed**, one existing Windows file-symlink-privilege skip. Coverage includes plan assignment, source-backed area text, unsupported fields, legacy bundles and Florence regressions.
- TypeScript, scoped ESLint and Sanity schema validation passed; schema validation reported zero errors and zero warnings.
- Browser security policy blocked opening the local preview for this revision. No new desktop/mobile browser verification is claimed. The local preview server was restarted on port 3018 with the six-image bundle; enquiry and intake features remain disabled.
- No full production build, Sanity upload, publication or deployment was performed for this local-draft update. Remaining publication requirements above still apply.

### 11 October clarification update

- New local bundle generated successfully with one native draft and five verified JPEG assets at `C:/Users/surya/Downloads/Haus-North-London-prepared-2026-10-11`. Original email evidence, source boards and the previous bundle are preserved.
- Media preparation: **24 tests passed**, one existing Windows symlink-privilege skip. Preview loader: **46 tests passed**. Shared property renderer: **13 tests passed**. Coverage includes old bundles, mismatched/unsupported commercial facts, provenance validation, address/map exclusions and Florence regressions. TypeScript and scoped ESLint passed.
- Desktop browser on port 3018 shows **£500,000**, **three bedrooms**, **Terraced House**, **Ready**, and **North London, London**. `noindex, nofollow` and disabled enquiry controls remain in place; concept captions remain visible. Screenshot: `C:/Users/surya/Downloads/Haus-North-London-preview-runtime-2026-10-11/confirmed-details.png`.
- The local server uses the new bundle and `.next-london-preview`; runtime logs are in the screenshot directory. No production build, publication, Sanity upload or email send was performed for this update.

### Original 6 October preparation

- Preparation: 21 tests passed; one existing Windows symlink-privilege skip. New actual London bundle generated successfully after source/evidence validation.
- Full Vitest suite: **73 files / 558 tests passed**, including preview/Florence/shared-property regressions. Scoped ESLint, TypeScript and Sanity schema validation passed (zero schema errors/warnings).
- Browser checked at desktop and 390px mobile: all five images load, concept boards remain uncropped, explanatory captions are visible, there is no horizontal overflow, the page is noindex/nofollow, enquiries are disabled, and the preview index links to the detail page. The viewport override was reset afterwards.
- No full production build or hosted delivery test was run for this local-draft addition. No Sanity write, deployment, production configuration change or customer email is part of this task.
