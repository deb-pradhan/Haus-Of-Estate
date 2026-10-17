# SEO & Conversion-Marketing Audit — Haus of Estate (mega-upgrade)

Audited 18 Oct 2026, branch `mega-upgrade`, plus live checks of https://hausofestate.com (robots, sitemap, 6 pages, 4 posts, competitor homepages).
Scope: read-only on source. Keyword volumes are NOT verified (Ahrefs/Similarweb connectors need authorising); treat clusters as hypotheses to validate in Search Console/Ahrefs.
Legend: Impact H/M/L · Effort S/M/L · Code = doable in this repo now (Y), needs CMS/content (C), needs business/legal decision (B).

## 0. Headline context that shapes everything
- Live site publishes only 2 properties (`/properties/al-furjan`, `/properties/monaco-mansions`; sitemap) plus 25+ blog posts, mostly UAE news. London is a held draft (docs/urgent-website-release-2026-10-15.md). The brand is lead-routing, not a listings portal (memory: NOT authorised to list). So the SEO moat is **guides + area/market explainers + proof**, not inventory. Do not mark pages up as listings/offers.
- Brand/meta promise four markets (Dubai, UK, Bali, Cyprus; `layout.tsx:25`, `manifest.ts:8`) but Cyprus has zero on-site content, and is absent from the buyer modal, `/match`, search and services selectors. Bali is in the product, absent from the hero eyebrow. Align the entity story before scaling content.

## P0 — fix before/at launch (indexation and trust defects)

**P0-1. `/list-property` and `/auth/*` emit the homepage canonical and the default title.**
Evidence: `src/app/layout.tsx:49-51` sets `alternates.canonical: "/"` globally; `list-property/page.tsx:1` is `"use client"` so cannot export metadata; `auth/layout.tsx` has none. Live: `/list-property` → title "Haus of Estate — international property, with proof.", canonical `https://hausofestate.com`; `/auth/login` → 200, `index, follow`, canonical homepage. `/list-property` is also in `sitemap.ts:21`, so the sitemap contradicts its own canonical.
Fix: remove the global canonical from root layout (let each page declare its own; home sets `/`); split `list-property` into server `page.tsx` (metadata: "Sell or Let Your Overseas Property", canonical `/list-property`) + client `ListPropertyForm`; add `robots: {index:false}` to `(auth)/layout.tsx` and add `/auth/` to robots disallow. Impact H · Effort S · Code Y.

**P0-2. Unsubstantiated / contradictory claims across the site (ASA/CMA/DMCC exposure and E-E-A-T damage).**
Evidence (all must be sourced or removed):
- `buy-rent-sell.tsx:4-7`, `page.tsx:29,147`: "1,200+ clients matched since 2022", "15+ years' experience", "4.8★ average rating", "3 Continents" (4 markets span 2 continents). Company no. 17188168 (`company-identity.ts`) looks recently incorporated; attribute experience to "our team" if true.
- `about/page.tsx:163-168`: "1,200+ Properties Listed", "1,247+ Clients Assisted", "12 Countries Served", "350+ Investment Opportunities" contradict the homepage numbers and the not-listing positioning.
- `footer.tsx:114` "Rated 4.8 · Excellent"; `reviews-carousel.tsx:17-21` hard-coded market ratings with review counts (127/84/31); `homepage-reviews.tsx:8-63` fallback reviews with first names, dated 2024, no source/consent evidence. The DMCC Act 2024 fake-review rules (in force since Apr 2025) make unverifiable reviews a live risk.
- `partners.tsx:13-21` headline "Our developer partners" (Emaar, Damac, Nakheel…) vs its own footnote "developers our agent network transacts with" — rename to "Developers our agents work with" or get written permission; otherwise remove.
- `social-proof-strip.tsx` (unused) invents "Sold/Under offer" activity ("Downtown Dubai flat agreed below asking"). Delete the file so it can never ship.
- `contact/page.tsx:14,111`, `about/page.tsx:715`: "Offices in the UK & UAE" but only a Cardiff address exists anywhere.
- `(funnel)/match/page.tsx:459,1036`: "verified properties", named properties with prices, share link to `https://haus.ae/match` (wrong domain) — and `/match` is indexable.
Fix: single `src/lib/claims.ts` fed by evidenced numbers; remove anything not evidenced; add "as at <date>, source" under any stat; fix/hide `/match` mock content (noindex until real). Impact H · Effort S-M · Code Y (+B for sign-off).

**P0-3. GA4 attribution is destroyed by design.**
Evidence: `analytics.ts:36-38` forces `page_referrer: ""`, rewrites `page_location` to a clean path (UTMs/gclid stripped) and `page_title` to the path segment. In GA4 this makes organic, social, email and WhatsApp sessions read as "(direct)". Combined with no lead event (see §10) the site cannot tell which channel produces enquiries.
Fix: keep privacy posture but pass an allow-list: `utm_source|medium|campaign|content|term` and `document.referrer` origin only (no path/query); real `page_title` from a static map; add `generate_lead`. Impact H · Effort S · Code Y.

## P1 — next sprint (structure, schema, conversion)

**P1-1. No area/country landing pages or guides hub; entire non-brand opportunity is uncaptured.** Evidence: routes list (`src/app/(main)/**`) has no `/dubai`, `/uk`, `/bali`, `/cyprus`; `/properties` filters are query params canonicalised to `/properties` (`properties/page.tsx:12`). Fix: IA in §7; Sanity `area` + `guide` types; `[country]/[area]` and `/guides/[slug]` routes with `generateStaticParams`. Impact H · Effort L · Code Y+C.

**P1-2. Property pages have no structured data, a weak title/description and a mailto-only CTA.** Evidence: `properties/[slug]/page.tsx:104-121` (title = bare `property.title`, e.g. live "Al Furjan — Haus of Estate"; description = summary); no JSON-LD (live: only the 5 site-wide nodes); CTA is `mailto:` (`:144,453`). Fix: title `"{Type} in {Community}, {City} — {price or 'Price on application'}"`; BreadcrumbList + `WebPage`/`Residence` (address, floorSize, numberOfRooms, NO Offer/RealEstateListing — see §3); primary CTA opens buyer modal pre-filled with property + WhatsApp secondary with prefilled text; mobile sticky CTA bar; "what happens next" 3 steps; "last verified" date; related guides/area link. Impact H · Effort M · Code Y.

**P1-3. Blog structured data and metadata defects.** Evidence: `blog/[slug]/page.tsx:109` `dateModified = publishedAt`; no BreadcrumbList (visual crumbs at `:133`); `SEO_QUERY` (`queries.ts:71`) omits `_updatedAt` and `status == "published"`; live Golden Visa title "…Buyer's Guide | Haus of Estate — Haus of Estate" (seoTitle contains brand, template re-appends); same post's meta description is 300+ chars with a literal "Keywords: …" list (stuffing, truncated in SERP). Fix: fetch `_updatedAt`; add BreadcrumbList, `inLanguage:'en-GB'`, `articleSection`, `wordCount`; strip brand from seoTitle via `title.absolute` when seoTitle present; schema validation (`seoDesc` max 160, no "Keywords:"); og:image with 1200×630 transform (currently raw asset URL, no dimensions; `:38`). Impact M-H · Effort S-M · Code Y.

**P1-4. Sitemap quality.** Evidence: `sitemap.ts:29-36` stamps every URL `lastModified: now` (live: all `2026-10-15T23:49:51Z`, changes per request) so Google learns to ignore lastmod; `changeFrequency`/`priority` are ignored by Google; omits `/properties/residential|commercial` (indexable, live canonical self) and `/match`. Fix: use Sanity `_updatedAt` (posts, properties); static pages from a build date constant; drop priority/changeFreq; decide on residential/commercial (§P2-2). Impact M · Effort S · Code Y.

**P1-5. Thin/duplicate blog corpus and cannibalisation.** Evidence (sitemap): two "Dubai vs London" posts (`dubai-vs-london-2026-…`, `dubai-vs-london-property-returns` 543 words), two escrow posts, two snagging posts; ugly slugs (`understanding-dubai-land-department-dld-dld-and-property-fees-in-2026` — H1 repeats "DLD DLD"); several off-brand news pieces (Disney Yas Island, Manchester City Abu Dhabi, Silicon Valley sandbox) that dilute topical focus; no UK/Bali/Cyprus buyer content beyond one UK post. Fix: consolidate pairs with 301s (`next.config.ts` redirects), rewrite thin posts to ≥1,200 words with sourced facts and a "Last updated" line, noindex or retire pure news, re-point evergreen content to `/guides`. Impact H · Effort M · Code C+Y (redirects).

**P1-6. Entity/NAP inconsistencies (local SEO + AI entity clarity).** Evidence: JSON-LD address "115 City Road, **Unit A**" (`layout.tsx:94-101`) vs registered office "**Unit 1**" (`company-identity.ts:8`) — footer labels them trading vs registered, but JSON-LD does not; UK mobile `+44 7496 033321` (site-wide) vs WhatsApp `+971 58 560 7033` (`footer.tsx:22`, `whatsapp-float.tsx:6`, `contact`) with no explanation; "Offices in UK & UAE" unsubstantiated. Fix: one NAP source (`company-identity.ts`) consumed by JSON-LD, footer, contact; label the two numbers (UK line / UAE & WhatsApp line); remove UAE-office claim unless a staffed address exists. Impact M · Effort S · Code Y (+B).

**P1-7. Homepage metadata and promise mismatch.** Evidence: title "Haus of Estate — international property, with proof." has no search term; description promises "replied to within 2 hours" (`layout.tsx:25`) while contact page says "two working hours" (`contact/page.tsx:35`, faq hero). Fix: title ≈ "Buy Property Abroad: Dubai, UK, Bali & Cyprus | Haus of Estate" (≤60 chars) with tagline moved to H1/OG; use "two working hours" everywhere (or measure and cite the SLA). Impact M · Effort S · Code Y.

**P1-8. Analytics events too coarse for conversion optimisation.** See §10. Impact H · Effort M · Code Y.

## P2 — planned improvements

**P2-1. Structured data hygiene (`layout.tsx:102-147`).** Organization and RealEstateAgent are separate duplicate nodes with the same name/URL/address; `priceRange: "$$$"` is meaningless for a service; no `legalName`/`identifier` (company no. 17188168, ICO ZC254915), `foundingDate`, `@id`-linked `publisher`; logo is an SVG (`Vector-1.svg`) — supply a ≥112px square PNG; WebSite node has no `publisher` link. Fix: one node `@type: ["Organization","RealEstateAgent"]` with `legalName`, `identifier`, two `ContactPoint`s (UK; UAE/WhatsApp), `areaServed` as Country objects, `knowsAbout`; WebSite `publisher: {@id}`; add `inLanguage`. Do not add SearchAction (sitelinks searchbox retired by Google). Impact M · Effort S · Code Y.

**P2-2. `/properties/residential` & `/properties/commercial` near-duplicates of `/properties`** (same component, intro copy only; commercial likely empty → soft-404). Fix: noindex when result count is 0 and fold into filters, or give each unique body copy + FAQ. Impact L-M · Effort S · Code Y.

**P2-3. Pagination/category canonicalisation on blog.** `blog/page.tsx:24` canonicalises `?category=` and `?page=` to `/blog`; category pages can never rank and page 2+ are hidden duplicates. Fix: path-based `/blog/category/[slug]` hubs (also serve as topic-cluster pillars) and self-canonical pagination. Impact M · Effort M · Code Y.

**P2-4. Internal linking and crawlable navigation.** Footer "Buy a property / Rent a property / Sell or let" are `<button>`s (`footer.tsx:189-191`), header Services menu only reaches `/services#…`; no links from homepage to any guide; blog posts have no in-body CTAs/link blocks to services; property page has no related-content block. Fix: real `<a href>` for every nav destination (modals as progressive enhancement), "Markets" mega-menu (Dubai/UK/Bali/Cyprus), footer "Guides" + "Markets" columns, in-article "Related guide" and "Speak to an agent" components, hub-and-spoke links in §7. Impact H · Effort M · Code Y.

**P2-5. AI/LLM search readiness.** Live: `/llms.txt` → 404. No robots policy for AI crawlers. Fix: add `src/app/llms.txt/route.ts` (+ optional `/llms-full.txt`) listing entity facts (legal name, company no., markets, services, contact, what we do/do not do — "we introduce, we do not list"), key guides and last-updated; explicitly allow GPTBot/ClaudeBot/PerplexityBot/Google-Extended in `robots.ts` (or decide policy); write answer-first intros ("In short:" 40-60 word summary), dated figures with source links, Q&A headings, visible "Last reviewed" and reviewer line; keep FAQPage JSON-LD on `/faq` and guides (Google restricts FAQ rich results to authoritative gov/health sites since 2023, so value here is machine readability, not SERP features). Impact M · Effort S · Code Y.

**P2-6. Core Web Vitals risks (no Lighthouse run — static review; measure in CrUX/PSI before acting).**
- Homepage HTML is ~203 KB (live `curl`), mostly inlined RSC payload for client sections; hero is text-only (good LCP candidate) but `HomepagePropertySearch` (client, 325 lines) sits in the hero — check INP on mobile.
- `DeferredSection` (`page.tsx:201-218`) wraps streamed Suspense sections in `content-visibility:auto` with guessed `containIntrinsicSize` (400-900px). Wrong guesses cause scroll-anchoring jumps/CLS; set per-section measured heights or only defer sections below 2 viewports that are non-streaming.
- `whatsapp-float.tsx:18-19` two permanent `animate-ping` layers + `animate-float`/`animate-shimmer` in the CTA banner run continuously: add `motion-safe:` / `prefers-reduced-motion` guards and stop animating after 1-2 cycles (CPU, a11y, battery).
- Fonts: `Cormorant_Garamond` loads four weights (`layout.tsx:17`); cut to the 2 used (500, 600) and verify `Inter` variable. Both use `display: swap` + next/font self-hosting (good).
- Images: `images.remotePatterns` allows `images.unsplash.com` and `api.dicebear.com` (third-party hotlinks hurt reliability/privacy; confirm unused in prod). Blog hero uses raw `asset->url` with `object-contain` (`blog/[slug]/page.tsx:70,197`) — request sized variants via `urlFor().width()`. Property hero already has `preload` and fixed aspect ratio (good).
- `Partners`/`SocialProofStrip` are `"use client"` for no reason (static markup) — remove directive.
Impact M · Effort S-M · Code Y.

**P2-7. `<html lang="en">` and locale.** `layout.tsx:164`: use `en-GB` (matches `og:locale en_GB`, manifest `lang`). No hreflang needed while one English site; do NOT add `en-AE` alternates unless distinct AE-priced content exists. Add `x-default` only when a second locale ships. Impact L · Effort S · Code Y.

## P3 — polish
- P3-1. 404 page emits both `noindex` (not-found) and `index, follow` + canonical `/` from root layout (live, `/llms.txt`). Status code is 404 so harmless; goes away with P0-1 canonical removal.
- P3-2. `robots.ts:12-13` `host` is a Yandex-only directive (ignored by Google); remove. Add Bing Webmaster Tools + IndexNow; confirm Search Console property is verified (no `verification` key in `metadata`).
- P3-3. `metadata.keywords` (`layout.tsx:38`) is ignored by Google/Bing; harmless, drop.
- P3-4. FAQ copy/schema: `FAQS_QUERY` orders by category; add `HomepageFaq` JSON-LD only if answers differ from /faq (avoid duplicate).
- P3-5. `sameAs` uses a Facebook `profile.php?id=` and a regional `in.pinterest.com` URL; swap for canonical vanity URLs where they exist.
- P3-6. Add `Content-Language: en-GB` header; add `<link rel="alternate" type="application/rss+xml">` and an RSS feed for the blog (aggregators, AI crawlers).

## 3. Structured-data verdicts (what to add, what to refuse)
| Type | Verdict | Why |
|---|---|---|
| Organization + RealEstateAgent | Merge into one node, enrich (P2-1) | Duplicate nodes, vague `priceRange` |
| BreadcrumbList | Add on property, blog, guide, area pages | Missing everywhere; visual crumbs already exist |
| BlogPosting/Article | Fix dates, add `_updatedAt`, `inLanguage` (P1-3) | `dateModified` always equals `datePublished` |
| FAQPage | Keep on /faq, add to guides | Valid; no SERP rich result for commercial sites since 2023, helps AI extraction |
| Product/Offer, RealEstateListing | **Do not add** | Not authorised to list/sell; "Price on application"; Google has no listing rich result; misleading markup risks manual action |
| Review / AggregateRating | **Do not add** | Self-serving Organization/LocalBusiness reviews are ineligible; hard-coded counts unverifiable; DMCC risk |
| LocalBusiness hours/geo | Only after GBP/NAP settled | Cardiff unit is not a public shopfront; treat as service-area |
| Place/Residence on property pages | Add without Offer | Gives entity facts (address, floorSize, rooms) safely |

## 4. Metadata per page (current → recommendation)
| Page | Current title / issue | Recommended |
|---|---|---|
| `/` | default title, no keyword | "Buy Property Abroad: Dubai, UK, Bali & Cyprus \| Haus of Estate"; meta ≤155 chars, SLA wording fixed |
| `/properties` | "Properties — …"; meta "starting with Al Furjan" reads thin | "Dubai & International Properties — Haus of Estate"; add intro copy + FAQ so the page is not a 2-card list |
| `/properties/[slug]` | bare title | pattern in P1-2; use summary ≤155 chars |
| `/about` | "About" (generic) | "About Haus of Estate — Vetted Overseas Property Advisers" |
| `/services` | "Services" | "Property Management, Staging & Furnishing Services" |
| `/renovations` | good ("Property Renovation Services UAE & UK") | keep; add `Service` JSON-LD |
| `/blog` | "Insights" | "Overseas Property Insights & Guides — Haus of Estate" |
| `/faq`,`/team`,`/contact` | single-word titles | add intent words ("Overseas Property FAQs", "Contact a Property Adviser") |
| `/list-property` | **default title, homepage canonical** | P0-1 |
| `/match` | indexable funnel with mock data | noindex until real |

## 5. Competitor snapshot (live, 18 Oct 2026)
- Rightmove Overseas: title "Find Overseas Property For Sale", description generic — owns UK-resident intent but is inventory-led with thin advice; our opening is advice + vetting + cost transparency.
- Property Finder: title "Apartments for sale in Dubai - 85616 flats…", ~264 `LocationFeatureSpecification` and 25 `Offer` nodes per results page; Bayut returns a bot challenge (503). Do not compete on inventory pages; compete on "explain it to a UK buyer" content they do not publish.
- Savills: full hreflang set (en-gb/en-ae/…), global entity; Knight Frank: hreflang `en`+`x-default`. We have none, but also only one language, so low priority.
- Positioning gap: no competitor foregrounds "proof" (title-deed/escrow/licence verification) or a UK-to-overseas buyer journey with costs.

## 6. Local SEO / GBP
- GBP: register as a **service-area business** for Cardiff (hide address) unless the unit is staffed at published hours; categories "Real estate consultant" + "Real estate agency" only if eligible. Add Dubai GBP only for a staffed UAE address.
- Citations: Companies House, ICO register, LinkedIn, PolicyBee badge are already referenced — make the legal block the NAP source (P1-6). Add Propertymark/TPO/CMP/AML-registration marks and UAE RERA/BRN/ORN + Trakheesi permit numbers on Dubai property adverts **only if held; compliance to confirm** (UAE advertising of specific properties normally needs a permit number).
- Reviews: only ask for Google reviews via a compliant flow; existing test (`tests/technical-seo.test.mjs:20-32`) hides unapproved Trustpilot/Google links — keep until business approves the platform.

## 7. Proposed IA / URL map (hub-and-spoke; lead-routing, no listings)
```
/                                  Home (markets selector + Proof Pack CTA)
/markets                           Index of 4 markets (optional)
/dubai                             Country hub: overview, costs snapshot, guides, areas, agent CTA
  /dubai/areas/downtown-dubai      Area pages (priority order below)
  /dubai/areas/dubai-marina        …palm-jumeirah, jumeirah-village-circle (jvc), business-bay,
  /dubai/areas/palm-jumeirah       dubai-hills-estate, al-furjan (exists as property), dubai-south,
  /dubai/areas/business-bay        jumeirah-lake-towers, dubai-creek-harbour, mbr-city
/uk                                Hub: "buying UK property from overseas" + "UK resident buying abroad"
  /uk/cities/london | manchester | birmingham | liverpool | leeds
/bali                              Hub (freehold rules, hak pakai vs leasehold, PT PMA)
  /bali/areas/canggu | ubud | uluwatu | seminyak
/cyprus                            Hub (residency-by-investment, title deeds) — build or drop from meta
  /cyprus/areas/paphos | limassol | larnaca
/guides                            Evergreen library (replaces evergreen content in /blog)
  /guides/buy-property-in-dubai-from-uk
  /guides/dubai-golden-visa-property
  /guides/dubai-off-plan-guide
  /guides/dubai-property-fees-and-taxes
  /guides/uk-buyer-overseas-mortgages
  /guides/buy-uk-property-from-overseas
  /guides/can-foreigners-buy-property-in-bali
  /guides/buy-property-in-cyprus-from-uk
/blog                              News/market notes (dated) + /blog/category/[slug]
/properties, /properties/[slug]    Unchanged (2 live, London pending)
/list-property, /contact, /faq, /about, /team, /services, /renovations   Unchanged slugs
```
Rules: every area page needs unique value (sourced market table, price bands as "from/typical" with dates, who it suits, commute/amenities, 4-6 area FAQs, 2 linked guides, agent CTA); publish only where there is unique content (doorway-page risk); refresh quarterly with visible date; each guide links up to its hub and sideways to 2-3 guides; hubs link to all spokes. Implement as Sanity `area`/`guide` docs + `src/app/(main)/[market]/…` with `generateStaticParams`, `generateMetadata`, BreadcrumbList + FAQPage JSON-LD, and a shared `<AgentCTA market area />`. Redirect old long-slug posts to their new `/guides/*` equivalents (301).

## 8. Keyword clusters (hypotheses — validate volumes first)
1. UK→Dubai: buy property in Dubai from UK; Dubai property for British buyers; Dubai mortgage non-resident UK.
2. Residency: Dubai Golden Visa property requirements; golden visa off-plan; AED 2m rule.
3. Costs/tax: Dubai property buying fees; DLD fee 4%; service charges; UK tax on Dubai rental income.
4. Off-plan & protection: off-plan Dubai pros and cons; RERA escrow; snagging UAE; payment plans.
5. Areas: Dubai Marina vs Downtown; JVC rental yields; Business Bay investment; Palm Jumeirah prices.
6. UK for overseas: non-resident buy-to-let mortgage; SDLT non-resident surcharge; buy UK property from UAE.
7. Bali: can foreigners buy property in Bali; hak pakai vs leasehold; Bali villa ROI.
8. Cyprus: buy property in Cyprus from UK; Cyprus residency by property.
9. Comparison: Dubai vs London property investment; best country to buy property abroad UK.
10. Brand/alternative: "Rightmove overseas alternative", "how to verify an overseas estate agent" (proof-led, brand-owned).

## 9. 12-article content calendar (Mon publish, starting 26 Oct 2026)
| # | Date | Title (working) | Target keyword | Intent | Format / hub | Lead magnet CTA |
|---|---|---|---|---|---|---|
| 1 | 26 Oct | How a UK Buyer Purchases Property in Dubai: Step by Step | buy property in dubai from uk | Info/commercial | Pillar guide `/guides/buy-property-in-dubai-from-uk` (2,000w, timeline graphic) | UK-to-Dubai 12-week checklist |
| 2 | 2 Nov | Dubai Property Fees and Taxes: The Full Cost Table | dubai property buying fees | Info (high intent) | Guide + calculator (refresh existing DLD post, 301) | True-cost calculator |
| 3 | 9 Nov | Dubai Golden Visa Through Property: 2026 Rules | dubai golden visa property requirements | Info | Rewrite existing post, fix title/meta | Eligibility checker |
| 4 | 16 Nov | Off-Plan in Dubai: What Your Escrow Protects (and Doesn't) | off plan dubai escrow rera | Info | Merge two escrow posts, 301 | Off-plan due-diligence list |
| 5 | 23 Nov | Buying UK Property From Overseas: Mortgages, SDLT and Timelines | non-resident uk mortgage; sdlt non resident | Info | `/guides/buy-uk-property-from-overseas` | UK overseas-buyer checklist |
| 6 | 30 Nov | Dubai vs London: Yields, Costs and Risk | dubai vs london property investment | Commercial | Merge two posts, add data table | Comparison sheet (quarterly) |
| 7 | 7 Dec | Dubai Marina vs Downtown vs Business Bay: Which Area Suits Which Buyer | dubai marina vs downtown | Commercial | Area-comparison, seeds area pages | Area shortlist call |
| 8 | 14 Dec | JVC: Honest Look at Yields, Service Charges and Tenants | jvc rental yield | Info/commercial | `/dubai/areas/jumeirah-village-circle` | Yield worksheet |
| 9 | 4 Jan | Can Foreigners Buy Property in Bali? Hak Pakai, Leasehold and PT PMA | can foreigners buy property in bali | Info | `/guides/can-foreigners-buy-property-in-bali` | Bali legal-structure primer |
| 10 | 11 Jan | Buying Property in Cyprus From the UK After Brexit | buy property in cyprus from uk | Info | `/guides/buy-property-in-cyprus-from-uk` (or drop Cyprus) | Cyprus title-deed checklist |
| 11 | 18 Jan | How to Verify an Overseas Property Agent (Our "Proof" Checklist) | verify estate agent dubai | Info/brand | Signature piece; linkable asset | Proof Pack PDF |
| 12 | 25 Jan | Overseas Property Market Briefing: Q1 2027 | dubai property market 2027 | News/E-E-A-T | Quarterly, dated, sourced | Briefing email signup |
Notes: every article needs sourced figures + "Last reviewed" date, named reviewer (business decision — bylines are currently company-only, `blog-author.ts`), 2 internal guide links, 1 agent CTA, FAQ block (JSON-LD). Do not publish tax/legal specifics without a qualified review; add "not legal or tax advice" line.

## 10. Analytics / event plan (`src/lib/analytics.ts`)
Current events: `page_view`, `property_click`, `article_click`, `contact_click` (conflates modal-open "enquiry" with phone/email/WhatsApp, `modal-context.tsx:42-43`), `property_search` (hero only, `:134`). `publicPath` (`:8-18`) excludes `/match`, `/auth`, `/careers`, so the funnel is unmeasured.
Add (all consent-gated, no PII):
- `generate_lead` {lead_type: buyer|seller|list_property|match|careers, market, form_location} fired on API 200 from `/api/leads|funnel` — the primary conversion.
- `lead_form_start`, `lead_form_step` (step n), `lead_form_error` for drop-off.
- `cta_click` {cta_id: hero_search|hero_match|banner|footer|sticky|property_enquire, page_type}.
- `modal_open` separated from `contact_click`.
- `market_select` {market}; `filter_apply` on /properties (category/type only, no free text).
- `guide_read` (50%/90% scroll), `faq_expand`, `calculator_use`, `proof_pack_download`.
- `whatsapp_click` {placement: float|footer|contact|404|property}.
- Properties: pass `content_group` (market, area) for reporting; add `/match` to `PUBLIC_PAGES` once real.
Fix attribution first (P0-3). Mark `generate_lead` as GA4 key event; build an Explorations funnel: landing → cta_click → lead_form_start → generate_lead. Add Search Console ↔ GA4 link and weekly query report.

## 11. Conversion copy and CTA review
**Homepage hero (`buy-rent-sell.tsx:22-39`)**
- Remove "Welcome to Haus of Estate." filler line; eyebrow "UK · UAE · International" → "Dubai · UK · Bali · Cyprus" (or the markets actually served).
- H1 "Property in Dubai, the UK & beyond — with proof." is strong and on-brand; keep. Add a one-line definition beneath: "Proof: verified title, licensed agent, itemised fees — before you commit."
- Sub (current: "wherever you're moving capital" reads investor-y/salesy): "Tell us what you're looking for. We introduce you to one vetted local agent and set out every cost in writing — no hidden fees."
- CTA hierarchy: primary = "Get matched with an agent" (opens buyer modal, tracked `cta_click hero_match`); secondary = "Browse properties"; tertiary = "See what proof means" (links to guide #11). Today the search form is the primary action, but only two properties exist, so UK/Bali/Cyprus searches hit the empty state — set expectation ("Search our partner communities") or lead with matching.
**Proof stack under hero:** replace "Transparent Transactions", "SSL Secured", "GDPR" badges (`page.tsx:23-26,175-179` — weak/generic) with verifiable trust: Companies House no. 17188168, ICO ZC254915, PolicyBee insurance (already in footer), response-time SLA. Move to directly beneath the CTAs.
**Social proof:** only evidenced numbers with "as at" dates; real reviews with consent and source link; named case-study cards ("UK buyer, Dubai Marina, 6 weeks — fees itemised") with permission. No ticker.
**Urgency without alarm** (replace "Advisors are available now — no waiting list", `page.tsx:127`): "We reply within two working hours (Mon–Fri, 09:00–18:00 UK)", "Off-plan payment plans change with each release — ask for what is open today", "Market briefing updated quarterly — last updated 14 Oct". Factual time and availability cues, never scarcity.
**Property page:** sidebar currently "Enquire about this property" → mailto. Better: heading "Request the Proof Pack for {community}", price/"Price on application", 3-step "what happens next", "Reply within two working hours", primary button (modal) + "Ask on WhatsApp" (prefilled) + email text link; mobile sticky bar; fee summary snippet linking to the fees guide.
**Mid-article CTA:** after the first H2 and at the end: "Speak to a {market} agent" (market from post category) — BlogCTA exists (`components/blog/BlogCTA.tsx`) but is used on the listing page; add in-article variant.
**Lead magnets:** (1) Overseas Buyer Proof Pack (country checklists), (2) True-cost calculator per market, (3) Dubai-vs-London quarterly yield sheet, (4) 12-week UK-to-Dubai timeline, (5) Golden Visa eligibility checker, (6) Area comparison PDF. Gate softly (email only).
**Email nurture hooks (Resend exists, `src/lib/email/resend.ts`):** D0 confirmation + "what happens next" + SLA; D1 Proof Pack; D3 true-cost breakdown for their market; D7 area shortlist guidance; D14 case study + book a call; monthly market briefing; re-engagement at D45 ("has your brief changed?"). Track `email_click` via UTMs (needs P0-3).

## 12. Quick-win code checklist (all Y, ≈1-2 days)
1. Remove global canonical; fix `/list-property` metadata; noindex `/auth/*` and `/match`.
2. Claims audit → `claims.ts`; delete `social-proof-strip.tsx`; fix `partners` heading; reconcile about/home numbers.
3. Analytics: UTM + referrer allow-list, `generate_lead`, `cta_click`.
4. Sitemap `_updatedAt`, drop priority/changeFreq; BreadcrumbList on property/blog; BlogPosting `dateModified`.
5. Property title/description pattern + CTA modal/WhatsApp; Golden Visa title fix (`title.absolute`).
6. `llms.txt` route; robots AI-crawler policy; `html lang="en-GB"`.
7. Reduced-motion guards; trim Cormorant weights; remove needless `"use client"`.
Business/content decisions needed: UAE office/licence claims, review platform, named reviewers, Cyprus in/out, which numbers are evidenced.
