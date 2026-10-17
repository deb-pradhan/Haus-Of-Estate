# Mega Upgrade — Change History

Trackable log of every change on branch `mega-upgrade`. Newest first. Each entry: date · area · what changed · why (audit ref) · files.
Roadmap: `ROADMAP.md`. Audits: `audits/`.

## 2026-10-18

### Trust & compliance
- **T-01 `/match` funnel made honest** (legal P0-8, RE audit). Removed `Math.random()` match count, fake "matching…" loader, invented "Verified" sample listings with prices and blurred "unlock" cards, `haus.ae` share link, "5 quick questions" overclaim. Submit now checks `response.ok` and shows an error instead of a false success. Added privacy-policy link, honest "what happens next". Page set `noindex`.
  Files: `src/app/(funnel)/match/page.tsx`, `src/app/(funnel)/match/layout.tsx`.

### Homepage (PM/Design)
- **C-03 Homepage restructured**: hero → How it works (3 steps) → services → featured → Markets → Our approach → reviews (only when real) → FAQ → closing CTA, with `Reveal` motion. Removed "1,200+ clients since 2022", team initials avatars, "SSL Secured/GDPR" badges, developer-partners strip, "vetted agents/no hidden fees/never a junior" claims (legal P0-2/P0-3/P1-5). Home declares its own canonical. WhatsApp float: no pulsing rings, smaller, lifts above sticky bar on property pages. Files: `src/app/(main)/page.tsx`, `src/components/landing/whatsapp-float.tsx`, `buy-rent-sell.tsx`.

### Technical SEO (WS-C, S-01…S-05)
- Root canonical removed (pages now self-canonical); `lang="en-GB"`; single Organization/RealEstateAgent + WebSite graph (no priceRange/SearchAction/Offer/Review); sitemap `lastmod` from Sanity `_updatedAt`; thin posts (<400 words) noindexed and excluded; robots disallows /api, /studio, /auth; `public/llms.txt`; `/list-property` own metadata via new layout; blog titles/descriptions cleaned, BlogPosting `dateModified`, BreadcrumbList; category/search views noindex.
- Helpers added: `<JsonLd/>`, `breadcrumbJsonLd`, `faqJsonLd`, `pageMetadata`, `propertyMetadata`, `trackLead`.
- Analytics: UTMs and click IDs preserved, referrer reduced to origin, static titles (privacy checks kept); GA4 `generate_lead` helper. 31 SEO/analytics tests pass.
- Report-only (Sanity-side, not changed): escrow/snagging duplicate post pairs need 301s; most `seoDesc` > 160 chars; five thin posts.
- Founder flags: registered office "Unit 1" vs trading "Unit A"; Cyprus claimed but no content; two phone numbers (UK mobile, UAE WhatsApp).

### Property experience (WS-D, C-04/C-05/C-06)
- **Cards v2**: image-first 4:3, one badge, serif tabular price, location, ≤3 facts, whole-card link with `lift`, concept-image caption preserved, skeletons, 1/2/3-column grid; community headings only at 6+ listings. Files: `property-card.tsx`, `property-grid.tsx`, `landing/property-showcase.tsx`, `properties/loading.tsx`.
- **/properties**: Buy/Rent/Off-plan links + GET filter form (location, type, beds, sort; works without JS), results count, removable chips, clear filters, empty state routing to enquiry, Home-rooted breadcrumbs. Files: `filter-bar.tsx`, `property-listing.tsx`, `empty-state-cta.tsx`, `property-taxonomy.ts` (`sort`).
- **Property detail**: scroll-snap gallery + lightbox, key facts, inline enquiry form (consent notice + optional unticked marketing box) replacing `mailto:`, WhatsApp link carrying title/URL, mobile sticky bar, desktop sticky card, material-information panel (renders only fields present), overseas risk warning, similar properties, consent-gated video, `propertyMetadata`/BreadcrumbList wiring. Internal `unitNumber` no longer shown. Files: `properties/[slug]/page.tsx`, `enquiry-form.tsx`, `sticky-cta.tsx`, `whatsapp-button.tsx`, `material-info.tsx`, `property-gallery.tsx`, `property-format.ts`, `queries.ts` (optional fields + `SIMILAR_PROPERTIES_QUERY`).
- Optional data fields the UI reads **if present** (not in Sanity schema; awaiting user approval to add): tenure, completionDate, leaseLength, serviceCharge, groundRent, councilTaxBand, epcRating, escrow, developerRegNo, permitNumber, permitIssuer, listingBrokerName, brokerOrn, agentBrn, brochure.
- Deferred: currency selector, map view, price-band filter (price is free text), filter-change analytics.

### Design system ("Quiet Confidence")
- **Principles & tokens** (`DESIGN-PRINCIPLES.md`): fluid type scale, e1–e3 tinted elevation, glass materials, motion easing, `estate-900/800`, `gold-700` (accessible gold text, 4.9:1), softened paper. Files: `src/app/globals.css`.
- **Primitives**: Button → pill, 44/52 px targets, press feedback, new `gold` variant (ink text, 5.2:1); Input → 48 px/12 px radius; new `Reveal` scroll-reveal; global `:focus-visible` ring, `text-wrap: balance/pretty`, smooth scroll. Files: `src/components/ui/button.tsx`, `input.tsx`, `reveal.tsx`.
- **Header**: glass sticky bar; utility bar no longer sticky; persistent "Speak to an advisor" CTA. File: `src/components/layout/header.tsx`.
- **Hero** rebuilt: depth gradients + architectural grid, headline "Property, with proof.", single search with Buy · Rent · Off-plan (was 5 toggles + 3 selects), unverifiable hero stats removed pending evidence. Files: `src/components/landing/buy-rent-sell.tsx`, `homepage-property-search.tsx`.

### Tooling / environment
- Repaired missing `@next/swc-darwin-arm64` native binary (`npm ci`; lockfile unchanged) so the dev server runs.

### Programme
- Branch `mega-upgrade` cut from `main` @ `128715a58`. Added `docs/mega-upgrade/` (roadmap, design principles, changelog, audits).
- Standing constraint recorded: Sanity CMS content is read-only.
