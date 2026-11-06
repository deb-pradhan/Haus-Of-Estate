# Portable property showcase fixture

`haus-properties.json` is a small, public-safe data fixture for a **protected design preview**. It is not a Sanity import, a catalogue of available units, or approval to publish property content. No application code or production configuration is changed by this folder.

## Contents and provenance

- Six Florence documents: the community overview, three villa bedroom collections and two townhouse bedroom collections. The collections retain 19 brochure design variants, their labelled floor plans and the townhouse interior illustrations.
- One North London property, projected from its publicly readable published listing on 6 November 2026. Its public asking price of GBP 500,000 is a dated snapshot, not a guarantee of current availability.
- 84 unique, existing Sanity CDN image URLs. Images are referenced rather than copied into Git. No original asset packages, full PDFs, credentials, customer data, private notes, exact London address or internal correspondence are included.

Florence facts and image associations come from the prepared property snapshot dated 5 November 2026, based on supplied brochures and curated project renders. Only an explicit set of presentation fields was retained. Document IDs use a `showcase-` prefix; each document has `status: draft` and `featured: false`.

## Required presentation rules

- **Florence prices and stock are intentionally absent.** The earlier price tables are not current inventory confirmation. Payment terms, handover and availability are also absent. Render the supplied inventory notice; never substitute zero prices, an available badge or invented dates.
- Describe Florence amenities as **planned community amenities**, not operating facilities or guaranteed inclusions with every home. Architectural renders are illustrations, not photographs of completed homes.
- The existing `sellableAreaSqFt` design field retains the brochure figure. Display it as **Built-up area** and retain the source-label explanation. It is separate from plot area. These are design-level brochure areas, not an available-unit schedule.
- Plot numbers are withheld for `novoli-4-home-corner`, `novoli-6-home-corner` and `spada-8-home-corner`. Keep their `plotAreaStatus: conflict` and `areaNote` visible beside plans/areas. Uncropped source plans can themselves contain conflicting table/diagram figures; do not present those as a resolved measurement.
- Keep whole-row townhouse plan labels and shared-row exterior labels. A row illustration can depict multiple homes and bedroom types. Do not crop a floor plan to fill a thumbnail or imply a whole row is one dwelling.
- Interior palettes are brochure illustrations. Do not promise that buyers can select finishes or that illustrated furniture is included.
- London's area is **approximate gross internal floor area**, not plot size. Preserve its approximate-measurement wording and the BEFORE/AFTER comparison labels/captions. AFTER images show proposed AI-assisted interiors, not completed renovations. Use only the broad North London location.

## Adapting the fixture

Read the JSON's `properties` array. Each entry contains `document` (property fields), `media.hero` / `media.gallery` (resolved image URLs), and `display` (notices and labels). Design and floor-plan images also have resolved `src`, `alt`, dimensions and labels. Reuse existing property/detail components through an adapter rather than inventing a second production content model. Never feed these showcase IDs into a production write/import script.

The fixture needs no Sanity token, local drive paths or image download step. Allow image requests to `cdn.sanity.io`; the existing Next image configuration already permits it. Images remain dependent on the external CDN and may need replacement if an asset is later removed.

`brochureKey` values are identifiers for a **simulated** property/design request journey. They do not provide PDF access. Keep real intake, email sending, tracking and customer messaging disabled. Use fictional contact details in demonstrations and show email previews without sending them. Never claim a lead was saved or an email delivered unless the real workflow has been separately enabled and verified.

The existing `/dev/property-previews` loader depends on development mode and local prepared bundles. This JSON does not make that loader portable. A cloud preview needs a separate explicit fixture adapter, protected access and `noindex` headers. **Do not set `NODE_ENV=development` on a production-built hosting preview to bypass guards.** Noindex alone is not access control. Full brochures remain outside this fixture and must not be made public to complete a demo.
