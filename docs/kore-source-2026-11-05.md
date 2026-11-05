# Kore source record — 5 November 2026

One development-level `property` offering, consistent with Al Furjan. It is not three available individual units. Stable native draft ID: `drafts.kore-wellness-residence`; intended public ID: `kore-wellness-residence`; slug: `kore-wellness-residence`. Local source: `scripts/kore-wellness-residence.staging-draft.ndjson`. The native draft was saved on 5 November; do not import a duplicate. It remains unpublished pending the compatible deployment. See `docs/property-release-2026-11-05.md` for the receipt and publication sequence.

## Supplied commercial evidence

Surya supplied Sonia's 20 October 2026 WhatsApp project note again on 5 November and requested this offering in the new focused release. Preserve the original figures:

| Home type | Starting size (sq ft) | Starting price (AED) |
| --- | ---: | ---: |
| Studio | 406 | 679,000 |
| 1 bedroom | 669 | 1,100,000 |
| 2 bedrooms | 1,406 | 1,550,000 |

The source does **not** identify these sizes as plot, gross internal, sellable or built-up area. The public label is **Starting size**. The top-level `bedrooms` and `sizeDisplay` fields stay unset: neither one value nor an invented range can describe all three types accurately. `homeTypes` stores the supplied schedule in the existing property model. The catalogue bedroom filter can match its 0/1/2 bedroom entries without inventing a main bedroom count.

Sonia supplied B+G+3P+13+R, target completion Q4 2028, a 50/50 plan and an alternative 60/40 post-handover plan. The alternative has 40% payable after handover over three years and a 10% price increase. Keep that qualification adjacent to the alternative plan. No adjusted prices, exact handover day, payment instalments, deposit or refund terms are calculated. Off-plan/sale are derived from the future development completion and supplied purchase offer; they do not establish stock availability.

The ten listed planned amenities are swimming pool (25 metres), Technogym, padel court, The Hike, red light therapy, sauna, active co-working stations, edible garden, green spaces and club lounge. Do not imply they are operational or make health-benefit claims.

The source's EOI amounts are 50K/80K/100K. Omit them from public content until their currency and reservation conditions are explicitly confirmed. EOI amounts are not property sale prices.

## Identity and location verification

Sonia supplied the title Kore — Wellness Residence and DLRC location with [this map](https://maps.app.goo.gl/VTDQchxQW25TSNvC8). On 5 November it resolved to Kore by IMTIAZ, at 25.088721, 55.3779827. [The developer's own project page](https://imtiaz.ae/property/kore-by-imtiaz), checked 5 November, corroborates Imtiaz Developments and a Dubailand setting. Those are independently verified facts, separate from the Haus-supplied commercial note. No competitor's inventory, payment milestones, precise handover day or additional specifications are copied.

## Missing media and remaining checks

### Public-reference review, 5 November evening

Surya requested the public name **Kore by Imtiaz** and supplied [PropertyAE's Kore page](https://www.propertyae.ae/projects/kore-by-imtiaz#units) as guidance. Keep the existing native ID and slug. Use the reference's overview/home-types/payment/completion/amenity structure, not its unverified inventory or conflicting commercial details: it lists starting sizes of 675/1,409 sq ft instead of Sonia's 669/1,406, a precise 15 December 2028 handover instead of Q4, and no post-handover period rather than Sonia's qualified 60/40 alternative. Sonia's supplied figures remain unchanged. Imtiaz's own Kore page corroborates the name and wellness positioning and now shows interior/exterior imagery; it is not an approved Haus media package. Missing media does not technically block a text-first listing.

Named Kore/Wellness/DLRC assets were not found in Downloads, `OneDrive/Documents/hausofestate files` or relevant repository sources. Gmail searches found no Kore project email/attachment. A Florence image named Wellness is not Kore imagery. Use the neutral image-unavailable treatment; do not substitute Florence, stock or AI renders. No floor plans or brochure have been supplied for this project. The official website gallery is not treated as a Haus-approved media package.

Before native Sanity publication, review the draft and current marketed offering with Haus, confirm current starting-price applicability and stock, and supply approved imagery when available. Do not invent CMS approval receipts or approver timestamps. Public enquiries use the existing `info@hausofestate.com` mail link; no form acceptance, brochure delivery or Resend sending is enabled here.

Local review: `/dev/kore-preview` renders the shared property component, is noindex, disables enquiries, and returns 404 outside development. It is an editorial preview, not a second content store for public listings. After import/publication, the standard Sanity property query and `/properties/kore-wellness-residence` route supply public content and SEO title/summary, with the existing brand social fallback until approved project media is added.
