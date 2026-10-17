# Real-estate agent + first-time-buyer audit: Haus of Estate (branch mega-upgrade)

Audited: live http://localhost:3457 (/, /properties, /properties/residential, 3 detail pages, /services, /about, /contact, /list-property, /match, /team, /blog, /faq, /renovations) plus source (property schema, taxonomy, listing/detail/card components, lead modals, /api/leads, funel.md, PRD.md).
Date 2026-10-18. Voice: UK English throughout.

Tags: **[NOW]** = code-doable now; **[CONTENT]** = needs content, data or founder input; **[LEGAL]** = founder/solicitor/regulator confirmation needed before shipping.
Evidence key for competitors: **V** = fetched/confirmed this session; unmarked = industry knowledge, not re-verified (Knight Frank, Bayut and Rightmove pages were mostly nav-only or returned 503; treat their cells as a hypothesis to spot-check in a browser).

---

## 0. State of play (what I actually saw)

- Live inventory = **3 listings**: Azizi Monaco Mansions (off-plan, "From AED 50,039,000"), Al Furjan (off-plan, "Price on application"), North London 3-bed terrace (£500,000, ready). Three currencies' worth of logic (AED, GBP) in **free-text** `priceDisplay`, so nothing can be sorted, filtered, converted or computed.
- `/properties` has **no search bar, no sort, no count, no map, no pagination** on the page itself. Filters exist only via homepage hero search / header mega-menu (URL params) and show as removable chips afterwards. Listings are grouped by community, not ranked.
- Detail page = hero + fact tiles + description + features/amenities/location times + floor plans + video + gallery + a **sticky aside whose only CTA is a `mailto:` link**. On mobile the aside (and therefore the **price**) renders **after all content**; there is no sticky bottom CTA.
- Dead code: `src/components/property/property-card.tsx`, `search/search-filters.tsx`, `src/data/mock.ts` (numeric price, AED ranges, agent avatars, `verified`) are not used by live routes; `/saved`, `/compare`, `/search`, `/viewings` are empty dirs (404). The good UX ideas already sketched there (save heart, agent response time, verified badge) are not reachable.
- Strong points to keep: honest concept-image labelling (BEFORE/AFTER, "not completed works"), approx. floor area with measurement disclaimer, floor plan section, walk-through video support, UK registered-company footer (company no., ICO), calm voice, "no obligation" framing.

---

## 1. Competitor feature matrix

Legend: Y = yes, P = partial, N = no, ? = could not verify. HoE = Haus of Estate today.

| Feature | Rightmove (Overseas) | Property Finder | Bayut | Knight Frank | HoE today |
|---|---|---|---|---|---|
| Free-text + structured search | Y V (price min/max, beds, type, keyword) | Y V | Y | Y | P (homepage hero only; none on /properties) |
| Ready / Off-plan toggle | n/a | Y V | Y | P | Y (taxonomy) |
| Sort (price, newest) | Y V (high/low, newest/oldest) | ? | Y | Y | N |
| Result count + pagination | Y V ("57,444 results") | Y | Y | Y | P (count only when filtered) |
| Map view / map search | ? | Y V ("Map" link) | Y | Y | N |
| Save property (heart) | Y V | Y | Y | Y (My Knight Frank V nav) | N (dead code only) |
| Save search + email alerts | Y V (Save Search, Create Alert) | Y V (Create alert) | Y | Y | N |
| Compare listings | N | P | P | N | N |
| Multi-currency price | **Y V** (£/€ dual price, selector, rates refreshed 24h via Lumon) | AED only V | AED (+ converter) | Y (currency selector) | N (AED or GBP text) |
| Price per sq ft / sqm | P | Y | Y | P | N |
| Beds / baths / area on card | Y V | Y V | Y | Y | P (beds only; no baths, no area) |
| Status badges (new / price drop / featured) | Y V ("Featured", "New Home") | Y V (Verified, New project, price-drop, cashback) | Y | P | P (Ready/Off-plan, For sale) |
| Verified listing signal | P | **Y V** ("Verified", "Verified New") | Y (TruCheck-style) | n/a | N |
| Regulator permit no. (Dubai) | n/a | Y (validated against RERA, per help centre V) | **Y V** (permit must be linked; can't publish without) | Y | **N** |
| Floor plan indicator on card | Y V (icon) | Y V (tag) | Y | Y | N |
| Floor plans on detail | Y | Y | Y | Y | Y (strong) |
| Virtual tour / 360 / video | Y V (icon) | Y | Y | Y | P (video embed only) |
| Off-plan: delivery date | n/a | Y V (e.g. "Q3 2030") | Y | P | N (only "Off-plan") |
| Off-plan: payment plan (e.g. 20/60/20) | n/a | **Y V** | Y | P | P ("Standard" free text) |
| Off-plan: developer + logo | n/a | Y V | Y | P | P (text only) |
| Service charge, DLD fee, running cost | n/a | P | P | P | N |
| Rental yield / ROI | N | P | Y (area yield stats) | P | N |
| Mortgage calculator | P | **Y V** (+ rent-vs-buy, affordability) | Y | P | N |
| Agent / adviser on listing | **Y V** (logo, name, branch, phone, "Marketed by") | Y V (photo, SUPERAGENT, Call + WhatsApp) | Y | Y | N (generic aside; /team is empty) |
| Enquiry method | Y V (email form, call, "local call rate") | Y V (Call, WhatsApp, form) | Y | Y | **P (mailto only)** |
| Area guide on listing | P | Y | Y (area guides, price trends) | Y (research) | P (community text per listing) |
| Price history / market trend | N | P | Y | Y (research) | N |
| "Listed X days ago" / freshness | Y V ("Added on") | Y V ("Listed 5 days ago") | Y | P | N |
| Client-reviews / agent ratings | P | P | Y | Y (awards) | P (reviews present, provenance weak: see s.6) |

Sotheby's, Savills, Betterhomes, Emaar, Damac (industry knowledge, unverified): Sotheby's/Savills lead with editorial hero + sparse card + "Contact [named person]" + currency selector; Betterhomes/Emaar/Damac emphasise payment plans, handover dates, floor-plan unit explorers, brochure download gated by phone/email, "Register your interest" and (Emaar/Damac) sales-gallery booking. Off-plan buyers expect: unit/floor availability table, payment-plan timeline graphic, escrow/RERA project number, brochure PDF.

---

## 2. Listing data model: agent's verdict

Current `property` schema: title, slug, community, city, country, developer, category, availability[], listingType[], unitType, unitNumber (internal), masterDevelopment, view, plotSizeDisplay, paymentPlan (string), bedrooms, bathrooms, sizeDisplay (string), priceDisplay (string), rentPriceDisplay (string), completionStatus, summary, description, keyFeatures, amenities, locationBenefits, featuredImage, gallery, floorPlans, videoUrl, enquiryEmail, publishedAt, status, featured.

Verdict: **good for a brochure, wrong for a marketplace.** Everything that buyers compare on is a display string, so it cannot be filtered, sorted, converted or validated.

| Needed field | Today | Fix | Tag |
|---|---|---|---|
| Price as number + ISO currency (`price`, `priceCurrency`, `priceFrom` bool, `priceOnApplication` bool) | free text | add typed fields, keep `priceDisplay` as override | NOW |
| Rent price number + period | free text | `rentPrice`, `rentPeriod` | NOW |
| Floor area numeric (`areaSqft`, derive sqm; `areaMin/Max` for ranges), plot area numeric | free text | typed + unit toggle (sq ft / m2) | NOW |
| Tenure (freehold / leasehold / share of freehold / foreign-ownership zone) + lease years remaining + ground rent | missing | add; **critical for UK** and for Dubai freehold-zone clarity | NOW (schema) / CONTENT (values) |
| Off-plan: handover date (quarter + year), launch date, construction % , escrow account / project registration no. | missing (only a status enum) | add `handoverQuarter`, `handoverYear`, `projectRegNo`, `escrowBank` | NOW / CONTENT |
| Payment plan structured (milestones: % + trigger, e.g. 10% booking, 50% construction, 40% handover; post-handover %) | single string "Standard" | array of {label, percent, due} + auto-render timeline bar | NOW / CONTENT |
| Regulator ids: Dubai RERA broker ORN, listing permit (Trakheesi), DLD/Oqood; UK none but show Propertymark / redress scheme | missing | `permitNumber`, `permitIssuer`, `permitValidUntil`; **hide listing from public until present for Dubai** | NOW / LEGAL |
| Costs: service charge (per sq ft per year), DLD 4% + admin, agency fee, stamp duty (UK SDLT incl. non-resident surcharge), ground rent, council tax band, EPC rating | missing | add numeric fields; compute indicative totals | NOW / CONTENT |
| Yield: gross rental yield, indicative rent, basis + date + source | missing | `indicativeRent`, `yieldBasis`; never show without a source line | NOW / CONTENT |
| Furnishing (furnished / part / unfurnished), parking, balcony m2, floor level, building height, year built, condition, vacant/tenanted | missing | add enums | NOW / CONTENT |
| Geo: lat/lng, postcode / area code, neighbourhood slug, distance rows (already `locationBenefits`) | missing (city text only) | `geopoint` + area reference to an Area document | NOW |
| Developer as a reference doc (logo, track record, delivered projects) not a string | string | `developer` reference | NOW / CONTENT |
| Brochure PDF, payment-plan PDF, 360 / Matterport URL, more than YouTube/Vimeo | missing | file + url fields | NOW / CONTENT |
| Listed-by: named adviser reference (name, photo, licence/BRN, languages, WhatsApp) | missing | `adviser` reference | NOW / CONTENT |
| `lastVerifiedAt`, `availabilityCheckedAt` (displayed "Availability checked 14 Oct") | missing (`publishedAt` only) | add; show on card + detail; auto-flag stale > 14 days | NOW |
| Reference number (public, e.g. HOE-DXB-0012) | `unitNumber` internal only | add `ref`; used in enquiries and WhatsApp prefill | NOW |
| Taxonomy mismatch: schema has `listingType[]` + `availability[]` arrays (a listing can be both ready and off-plan, sale and rent) yet cards show a single price | ambiguous | for multi-unit developments model **Development > Units/Types** (beds, from-price, size range, availability) | NOW (design) |

Unit-level modelling matters most for Monaco/Al Furjan: they are developments, so one headline price hides studio-to-3-bed ranges. Add a **"Unit types & prices" table** (type, beds, size from-to, price from, availability).

---

## 3. Top 15 feature gaps, ranked by conversion impact

1. **On-page enquiry form + WhatsApp-with-context** instead of `mailto:`. Mailto fails for webmail users and mobile without a mail client; no record, no attribution, no score. Capture name, WhatsApp/email, optional message, preferred contact time, listing ref. POST to `/api/leads` with `propertyId/slug`. [NOW]
2. **Price visible in hero + sticky mobile CTA bar** ("From £500,000 | Enquire | WhatsApp"). Price is currently below the whole page on mobile. [NOW]
3. **Typed price/currency + visitor currency selector (GBP, AED, EUR, USD, INR) with dated rate note.** Core to UK/Gulf/India expats; Rightmove Overseas does this V. [NOW; rates feed/provider = CONTENT decision]
4. **Search + sort + result count on /properties**, location autocomplete, price min/max, beds, type, ready/off-plan, intent; sticky filter bar; sort by newest/price. [NOW]
5. **Named adviser/agent block with photo, licence no., languages, response time** on every listing and /team populated. Today "Team profiles coming soon" is the biggest human-trust gap. [CONTENT + NOW]
6. **Dubai regulatory block: broker ORN, listing permit number, escrow/project reg, link to verify on DLD.** Portal norm; absence reads as "unlicensed". [LEGAL + CONTENT, NOW for UI]
7. **Off-plan block: handover date, payment-plan timeline, unit-types table, developer card, brochure.** Off-plan is 2 of 3 listings. [NOW + CONTENT]
8. **Total-cost-of-buying panel** (DLD 4%, agency, service charge; UK SDLT incl. non-resident surcharge) + **mortgage calculator**. Remove "what will this really cost me" anxiety. Calculators: pure code. Rates/fees must be dated and sourced. [NOW + CONTENT/LEGAL]
9. **Yield / ROI with sourced basis** (or honest "Yield not published for this unit"). Investors are the stated audience; "transparency on yields" is already promised in copy. [CONTENT]
10. **Save property + save search + email/WhatsApp alerts** (needs account or just email-capture "Alert me": lighter and also a lead). [NOW]
11. **Map view + neighbourhood context** (geopoint, nearest metro / school / airport, mini area guide). Existing `locationBenefits` is a strong seed. [NOW + CONTENT]
12. **Card enrichment**: beds, baths, area, price/sq ft, status, "added/verified X days ago", handover date for off-plan, floor-plan and video icons. [NOW]
13. **Gallery lightbox with count + keyboard** and a "Floor plan" and "Video" jump nav at top of detail. Floor plans currently open in a new tab. [NOW]
14. **Per-listing structured data (Schema.org `RealEstateListing`/`Offer`) + share/print/PDF fact sheet.** Only org-level JSON-LD today. Also helps agents forward to spouses/accountants. [NOW]
15. **Compare (2-3 listings) and recently viewed**; lower priority until inventory > ~10. [NOW]

Related blockers: **inventory depth** (3 listings; every non-Dubai hero-search location is an empty state) is a CONTENT gap bigger than any feature; sort out before paid traffic.

---

## 4. Ideal listing card spec

Aspect ratio 4:3 image with carousel (max 5), swipeable on touch. Entire card is one link; heart and carousel arrows are separate targets (min 44 px).

```
[ image carousel  1/6 ]   top-left: status chip   (Ready | Off-plan Q4 2028 | Price reduced | New)
                          top-right: heart (save)
                          bottom-left: icons (floor plan, video, 3D tour) if present
-----------------------------------------------------------------
£500,000        (AED 2.3M approx.)     <- local price + chosen-currency echo, "From" for ranges
Terraced house · 3 bed · 2 bath · 890 sq ft (82.7 m²)
North London, London · Freehold          <- tenure for UK; "Freehold area" or "Dubai South" for UAE
Off-plan: 40/60 plan · Handover Q4 2028 · Azizi Developments   <- one muted line, off-plan only
Verified 14 Oct · Ref HOE-LDN-0003
[Enquire]   [WhatsApp]                    <- secondary; whole card still opens detail
```
Rules: show every number the data has, hide fields the data lacks (never "On application" on the card); one price only (no mixed sale/rent unless intent filter says so); max 3 lines of text; no summary paragraph on the card (move to detail); concept-media chip "Concept images" when `mediaKind=concept` (keep current honesty). Badges only if true: "Verified" means a named human checked within N days (see s.6). Skeleton + alt text on images. [NOW for layout, CONTENT for numbers]

---

## 5. Listing detail page anatomy (section by section)

1. **Breadcrumb + back to results** (preserve filter state via `?from=` or history). Add prev/next listing.
2. **Hero gallery**: 1 large + 4 thumbs mosaic on desktop, swipe carousel on mobile, "See all 18 photos / Floor plan / Video / 3D" tabs; lightbox. Concept images keep `object-contain` + visible caption.
3. **Title block**: type, headline, address/area, ref no., **price + currency toggle + "price per sq ft"**, status chip, last-verified date, share / save / print.
4. **Key facts bar** (bed, bath, area sq ft & m2, tenure, furnishing, view, floor, parking, completion/handover). Hide empty fields; never render "Size: On application" (appears today on Al Furjan).
5. **Sticky enquiry panel (desktop right, mobile bottom bar)**: adviser photo + name + licence no. + "Usually replies within 2 working hours" (only if measured), 3-field form (name, WhatsApp/email, message prefilled "I'm interested in HOE-LDN-0003"), consent line in plain English, WhatsApp button, "Request viewing / video call" button. Remove fake urgency.
6. **Overview + "why this property"** (3 bullet highlights, then description, expandable).
7. **Off-plan block** (conditional): handover date, construction status, developer card (logo, projects delivered, with sources), unit-types table, **payment-plan timeline bar**, escrow/RERA project registration, brochure download (gated optional).
8. **Costs & returns** (conditional): indicative total cost to buy, service charge, council tax / ground rent, **gross yield with basis + date**, mortgage calculator (non-resident presets), "talk to a mortgage partner" CTA. Footnote: indicative, not advice.
9. **Floor plans** inline viewer (zoom, pinch) with the measurement disclaimer (already good) + unit selector for developments.
10. **Features & amenities** grouped (Interior, Building, Community) with icons; keep tick list.
11. **Location**: map with pin (privacy-fuzzed if address withheld), distance table (existing), nearest metro / schools / airport, link to area guide (blog posts on Dubai/UK areas already exist: 26 articles).
12. **Video / 3D tour** (YouTube/Vimeo + Matterport) near top via jump nav.
13. **Legal & regulatory strip**: Dubai permit no. + broker ORN + "verify on DLD"; UK: Propertymark / redress scheme / ICO / AML registration; "Haus of Estate Ltd, company no. 17188168". Include "Photos and prices are indicative, subject to availability."
14. **Buying from abroad FAQ** (deposit, reservation, who holds funds, time to complete, remote purchase by power of attorney, currency transfer, taxes, can foreigners buy here). Ten Qs, per market. [CONTENT/LEGAL]
15. **Similar properties** + "Not quite right? Get matched" CTA (links to /match).
16. **Footer CTA** repeating adviser + form. Structured data (RealEstateListing, Offer, Place, Residence) in head.

---

## 6. Trust-signal inventory

### Exists and is good
- Registered company name, number, registered office, ICO registration number in footer (and org JSON-LD).
- Honest concept-image labelling and measurement disclaimers on North London listing.
- "No obligation / no hidden fees / vetted agents" framing; consistent UK voice; 26 published blog articles; privacy/cookie/terms pages; consent checkbox on forms.

### Exists but risky (fix or remove before paid traffic) **[LEGAL/CONTENT]**
- **Homepage reviews**: 6 testimonials, labelled "Verified", with dates June-Dec 2024, plus 4.9 (127), 4.8 (84), 5 (31) market counts, and "Rated 4.8 · Excellent" in the footer, "4.8★ Average rating". The company number is a recent-series Companies House number and the listings channel is new; verify incorporation date vs "since 2022" and vs 2024 testimonials. If these cannot be traced to a real review platform (Trustpilot / Google / Reviews.io) with a link, they are **fabricated-looking social proof**: remove or relabel. Duplicated carousel items also make it obvious.
- **"1,200+ clients matched since 2022" and "15+ years' experience"** (home) vs **"1,200+ Properties Listed", "1,247+ Clients Assisted", "350+ Investment Opportunities", "12 countries"** (about) vs "3 continents". Internally inconsistent and unverifiable. Use only numbers the founder can evidence, with date ("as at Oct 2026").
- **Developer logo strip** (Emaar, Damac, Nakheel, Sobha, Meraas, Dubai Properties) with small-print "partnerships shown reflect developers our agent network transacts with". Implied endorsement; confirm written permission or drop to text "Developments we can introduce".
- **/match page**: "verified properties curated by our local team", "Licensed Agents in Each Region", "Verified Listings Across 3 Markets"; with 3 listings and no named licensed agents, these are claims without proof. And the results screen shows **`Math.floor(Math.random()*8)+4` "properties match your criteria"**: a fabricated number. Remove now. [NOW]
- Quiz "Checking … / Filtering by your budget / Curating your personalised shortlist" loading screen is theatre (timers only). Replace with honest "Thanks, an adviser will message you within X" or show real filtered results. [NOW]
- Address inconsistency: footer registered office says "Unit 1", footer trading address and contact page say "Unit A", contact page headline "Offices in the UK & UAE" but lists a single Cardiff address (no UAE address). [CONTENT]
- `SocialProofStrip` component (invented "Sold / Under Offer" ticker, named clients) is currently unused; **do not wire it in** unless backed by real transactions.
- Services page: "Gas Safe partners", "vetted & insured tradespeople": fine if true; keep evidence (insurance docs) on file.

### Missing (build once real) **[CONTENT/LEGAL]**
- Named people with photos, licence/BRN numbers, LinkedIn, languages (/team is a placeholder).
- **Dubai**: RERA broker (ORN) / brokerage licence number and listing permits; **UK**: redress scheme (TPO or PRS) membership, Propertymark/NAEA if applicable, HMRC AML supervision, client money protection if handling funds, complaints procedure, "how we are paid" (fee disclosure: who pays HoE, referral fee from agents/developers?). The FAQ says "What fees do I pay to Haus of Estate" but a conflict-of-interest line ("we may receive a referral fee from the agent/developer; you pay nothing extra") must be explicit now that HoE lists property.
- Capacity statement: is HoE the agent of record on listed properties, or an introducer to the developer's/owner's agent? Say it plainly on each listing.
- Independent reviews with outbound link; case studies with real (consented) names or anonymised-but-verifiable details; media mentions; partner/accreditation logos with permission.
- "How it works" with timeline, what happens after you enquire (who calls, when, what you are asked), data-handling promise (where leads go, how to delete).
- Secure-contact reassurance: HTTPS (exists), data-protection line near forms (GDPR badge is shown on a CTA; privacy link is better).

### Must NOT be faked (hard rules)
Review scores/counts/quotes, client names/avatars, "sold/under offer" activity, match counts, "verified" listing badges without a defined check, licence/permit numbers, developer partnerships or endorsements, "since 2022 / 15+ years" experience, awards, "licensed in each region", stock photos presented as the property, AI interiors presented as built (current treatment is correct: keep it), urgency counters ("3 people viewing"), yields/price-growth without source and date.

---

## 7. Search and filter spec

**Entry points**: homepage hero (exists), `/properties` sticky filter bar (new), header mega-menu (exists), market landing pages (`/properties/dubai`, `/uk`, `/bali`, `/cyprus`: SEO + curated).

**Primary bar (always visible)**: Intent (Buy / Rent / Off-plan), Location (typeahead over Area docs: "Dubai Marina", "Al Furjan", "London N-postcodes", not free text), Type (multi), Beds (min, chips), Price (min/max dropdowns in selected currency with sensible steps per market), **Currency** selector. Primary button "Search" and live "N properties".

**More filters (drawer on mobile, popover on desktop)**: completion (ready / off-plan / handover year range), payment plan (post-handover available, <=60/40), area sq ft min/max, baths, furnishing, view, tenure (freehold / leasehold), developer, features (balcony, pool, parking, sea view), "has floor plan", "has video / 3D", "price reduced", "added in last 7/30 days", keyword/ref no. search (HOE-xxx).

**Behaviour**: filters as URL params (already the pattern; extend `buildPropertiesHref`), debounced, no full page reload, preserved on back; chips removable (exists); **zero-results state** suggests nearest widening ("Remove 'Cardiff'" + "Tell us your brief" lead form, existing EmptyStateCTA is good); sort (Recommended, Newest, Price low-high, Price high-low, Price/sq ft, Handover soonest); pagination or "Load more" with count; list/grid/map toggle with map clustering; **Save search** => email capture + frequency (instant/daily/weekly) + WhatsApp opt-in.

**Dubai specifics**: sq ft default, AED; off-plan filters first-class. **UK specifics**: £, tenure, EPC, council tax band, "chain-free", "new build". **Bali/Cyprus**: leasehold years (Hak Pakai / HGB) and foreign-buyer eligibility chips: **required** for compliance and trust. [NOW for UI; CONTENT for area docs and values]

**Not worth building yet**: draw-on-map polygons, AI natural-language search, 3D unit explorer. (Revisit at >50 listings.)

---

## 8. Lead-capture journey critique

| Surface | Steps / fields | Friction and risks | Fix |
|---|---|---|---|
| Header "Speak to an advisor" / buyer modal (`buyer-modal.tsx`) | 4 choice steps (buy/rent, personal/investment, beds, market + area) then first name, email, mobile (international), consent; success screen | No budget, no timeline, no country of residence, **no listing context** (payload has no property id); choices are Dubai/UK/Bali-only (no Cyprus, no London boroughs); beds irrelevant for land/commercial; email AND mobile both required; no preferred channel; no "what happens next" until after submit | Make email **or** WhatsApp required (one of two); add budget band + timeline as optional chips; pass `source=listing:<slug>`; add "I'm in [country]" for call timing; show "an adviser replies within 2 working hours (Mon-Sat, UK/UAE hours)" |
| Listing "Enquire" (detail aside) | Click => `mailto:` | Breaks for webmail users; no capture, no attribution, no scoring, no analytics event; copy says "we'll connect you with a vetted agent for this community" which contradicts "now authorised to list" and reads as a handover to someone else | Inline form (s.5); update copy once the business model (agent vs introducer) is settled **[LEGAL]** |
| /match quiz (`(funnel)/match`) | 5 questions (intent, market, type, area, budget, timeline) then gate: first name, WhatsApp, email, phone | Strong design (matches funel.md) but: fake random result count; loading theatre; **API failure swallowed** (`catch (_) {}` still shows thank-you, leaving lead lost silently); budgets AED-only for Dubai (no GBP/INR equivalents); promises "verified properties curated" with 3 listings; no results actually shown | Show real matches (even 0-3) after submit; surface failures with retry + fallback WhatsApp link; budget in selectable currency; remove counts |
| /list-property (seller/landlord) | 5 steps: sell/rent, property details (type, beds, size, area, view), urgency, **documents (title deed + passport copy)**, contact | Asking for passport at step 4 before trust is built is a drop-off and a data-protection liability; **files are held in state but never sent** in the `/api/leads` payload while the UI says "encrypted and only accessible to authorised agents": false assurance; errors swallowed => always "success"; `urgency` includes a "distress" tier scored +25 (ethically sensitive; do not reveal in UI copy) | Remove document upload step (collect after first call, via secure link); surface API errors; reduce to 3 steps; add "free valuation: what you get and when" copy; ask Dubai-specific only when Dubai chosen |
| Contact page | Email, phone, WhatsApp, address, "Enquire on WhatsApp" button | **No form** despite "Send us a message"; offices claim vs single address | Add 4-field form (name, contact, topic, message) with response SLA; split UK / UAE contact and hours |
| Floating WhatsApp (`wa.me/971585607033`) | Click opens chat | Same generic prefill everywhere; UAE number vs UK +44 phone: confusing which is primary | Page-aware prefill ("Hi, I'm looking at HOE-LDN-0003 ..."); pick one primary number per market; show local hours |
| Post-submit | Thank-you modal | No email/WhatsApp confirmation visible to user; no calendar link; nurture exists in funel.md only | Auto-confirmation message with ref no. and next step; "Book a 15-min call" slot picker **[CONTENT]** |

**Minimum good form** (all lead surfaces share one component): Name (required) / one of WhatsApp or email (required) / optional: budget, timeline, country of residence, message / one consent line in plain English with privacy link / honest submit label ("Send my enquiry") / inline error recovery / success screen stating who will contact, how, and by when, with an edit/cancel route.

First-time buyer anxiety list (observed): "Is this real and legitimate?" (no named people, no licence numbers), "Is the price real?" (POA, mixed currencies, no totals), "What will it really cost me?" (no fees), "Can I even buy this as a foreigner?" (no eligibility, no tenure), "Who will call me and how many times?" (no policy), "Is my data safe?" (consent present, no data promise), "What if I'm abroad?" (no remote-buying guide), "How does HoE make money?" (not stated).

---

## 9. "Crazy-easy-to-use" checklist: 20 concrete changes

| # | Change | Tag |
|---|---|---|
| 1 | Replace `mailto:` enquiry with an inline 3-field form + WhatsApp button prefilled with listing ref | NOW |
| 2 | Put price in the detail hero; add sticky bottom bar on mobile (price + Enquire + WhatsApp) | NOW |
| 3 | Add search bar, sort, count and "Clear all" to the top of `/properties` (sticky on scroll) | NOW |
| 4 | Remove `Math.random` match count and fake loading steps on /match; show honest copy or real matches | NOW |
| 5 | Surface API failures in all three funnels (retry + WhatsApp fallback); stop swallowing errors | NOW |
| 6 | Remove title-deed/passport upload step from /list-property; collect later via secure link | NOW |
| 7 | One shared lead-form component: either email or WhatsApp required; consent in plain English; pass `source` and listing slug | NOW |
| 8 | Currency selector (GBP / AED / EUR / USD / INR) with "rate as at <date>" under every price | NOW + CONTENT (rate source) |
| 9 | Typed price, area (sq ft + m2 toggle), tenure, handover date, payment-plan milestones in the Sanity schema; migrate 3 listings | NOW |
| 10 | Hide empty facts; never print "On application" tiles; show "Ask for price" CTA instead | NOW |
| 11 | Enrich the card: beds, baths, area, price per sq ft, tenure/handover, status, "verified <date>", floor-plan/video icons | NOW |
| 12 | Gallery lightbox with swipe, counter and top jump-nav (Photos / Floor plan / Video / Map) | NOW |
| 13 | Inline floor-plan viewer with pinch-zoom (keep disclaimer) instead of opening a new tab | NOW |
| 14 | Add mortgage calculator + total-cost-of-buying panel on detail (dated, with "indicative" footnote) | NOW + CONTENT |
| 15 | Add Save heart + "Alert me when similar homes list" (email capture, WhatsApp opt-in) | NOW |
| 16 | Populate /team with real advisers (photo, licence no., languages); show the relevant adviser on each listing | CONTENT |
| 17 | Add regulatory strip (RERA ORN, permit no., redress scheme, ICO, company no.) to listing and footer; hide Dubai listings lacking permit | LEGAL + CONTENT |
| 18 | Clean unverifiable proof: replace testimonials/ratings/stats with evidenced figures or an outbound-linked review widget; align about-page vs home numbers | CONTENT / LEGAL |
| 19 | Write a one-screen "How it works and how we're paid" + "Buying from abroad" FAQ (10 Qs per market) linked from every enquiry form | CONTENT / LEGAL |
| 20 | Per-listing JSON-LD, printable/PDF fact sheet and share button; add Contact page form with response SLA and UK/UAE split | NOW |

Suggested sequencing: (1-7, 10, 20-form) as a **trust-and-capture sprint** (all code, no new content, ~1 week); (8, 9, 11-15) **marketplace-data sprint**; (16-19) run in parallel as **founder/legal tasks** since they gate the paid-traffic launch.

---

## 10. Open questions for the founder

1. Is Haus of Estate the **agent of record** on listed properties or an introducer? Drives copy, fees disclosure, and which regulators apply (RERA broker licence and Trakheesi permits for Dubai adverts; UK redress scheme + HMRC AML).
2. Incorporation date and trading history: what exactly is true behind "since 2022", "15+ years", "1,200+ clients"? Which review platform holds the real reviews?
3. Written developer permissions (Azizi, Emaar, Damac, etc.) for logos and imagery.
4. Referral/commission arrangements to disclose; whether HoE ever holds client money.
5. Who are the named advisers, and which markets/hours does each cover? One primary phone number per market?
6. Is rent inventory in scope (mega-menu greys it out with "Coming soon")? Same for commercial (all muted).
7. Preferred currency rate provider and refresh cadence; which currencies to support at launch.

Sources consulted this session: rightmove.co.uk Overseas (Spain results page: filters, dual-currency pricing, sort, save/alert), propertyfinder.ae (Dubai apartments-for-sale results page: card fields, badges, alert, mortgage tools), Property Finder and Bayut help-centre/search snippets on permits; local site HTML and source listed at top.
