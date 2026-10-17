# Haus of Estate — Mega Upgrade Roadmap

Branch: `mega-upgrade` · Led by: Project Manager · Living document (see `CHANGELOG.md` for history)
Last updated: 2026-10-18 (end of wave 1)

**Goal.** Take the existing Next.js site to a production-grade, market-ready international property brand
(UK-style, Rightmove-Overseas calibre, covering Dubai/UAE, UK, Bali, Cyprus): **trustworthy, crazy-easy to use,
high-converting, visually ahead of competitors**, built on the "Quiet Confidence" design principles
(`DESIGN-PRINCIPLES.md`).

## Standing constraints
1. **Sanity CMS content is off-limits.** Read-only. No seeding, publishing, backfills, or breaking schema edits.
   Schema additions only with explicit user approval (permit/tenure fields are *proposed*, not applied).
2. **Never invent facts** (registration numbers, reviews, stats, listings, partnerships). Unknowns are founder placeholders that render nothing until supplied.
3. UK English, calm advisory voice. Every number on the site must be evidenced or removed.
4. No commits to `main`. All work on `mega-upgrade`; PR-ready.

## The expert team
| Role | Owns | Source audit |
|---|---|---|
| Project Manager | Roadmap, sequencing, changelog, release gate | this file |
| Web Designer / Brand Manager | Design system, layout, copy voice | `DESIGN-PRINCIPLES.md` |
| Visual & Motion Designer | Motion tokens, reveal, micro-interactions, hero | `DESIGN-PRINCIPLES.md` §2 |
| Legal & Compliance | Claims, consent, policies, regulatory display | `audits/legal.md` |
| Marketing / SEO | Metadata, schema, IA, content, analytics | `audits/seo-marketing.md` |
| Real-estate expert / User critic | Listing model, search, enquiry journey | `audits/real-estate-ux.md` |
| SDE / Architect / QA | Security, perf, a11y, tests, CI | `audits/engineering-qa.md` |

## Findings that reshaped the plan (baseline, 2026-10-18)
- **Trust risk is the #1 blocker**: unverifiable stats ("1,200+ clients since 2022", 4.8★, "15+ years"), fallback reviews stamped "Verified", an Emaar/Damac "partners" strip, `/match` showing invented listings and a `Math.random()` match count, a homepage form that discards personal data yet says "Your enquiry is in".
- Conversion gaps: property detail enquiry is `mailto:`; no search/sort on `/properties`; free-text price/area; only ~3 listings; empty `/team`.
- SEO gaps: `/list-property` and `/auth/*` canonicalise to `/`; sitemap `lastModified` = now; no JSON-LD on properties; no area/guide hubs; no `llms.txt`; GA4 referrer/UTM stripped.
- Design gaps: flat hero with no depth, sub-44px controls, gold text at 2.58:1 contrast, double sticky header bars, unlayered tokens.

## Status legend
✅ done · 🟡 in progress · ⬜ planned · 🧑 needs founder input · ⛔ blocked/needs user approval

---

## Phase 0 — Foundation
| ID | Task | Owner | Status |
|---|---|---|---|
| P0-01 | Pull `main`, create `mega-upgrade`, repair local SWC binary, boot dev server | PM/SDE | ✅ |
| P0-02 | Parallel expert audits (legal, SEO, real-estate/UX, engineering) | PM | ✅ |
| P0-03 | Design principles + tokens (type scale, elevation, glass, motion, gold-700 text colour) | Design | ✅ |
| P0-04 | Primitives: pill Button (44/52px), 48px Input, `Reveal`, `.glass`, `.eyebrow`, focus ring | Design | ✅ |
| P0-05 | Roadmap + changelog + standing constraints | PM | ✅ |

## Phase 1 — Trust & compliance (blocks launch)
| ID | Task | Owner | Status |
|---|---|---|---|
| T-01 | `/match`: remove fake match count, fake loading, invented "Verified" listings and prices, `haus.ae` link; surface submit errors; `noindex` | SDE/Legal | ✅ |
| T-02 | Wire or remove homepage `ServicesToggle` form (currently discards PII, false success) | SDE/Legal | ✅ |
| T-03 | Remove unverifiable stats/ratings/reviews/"Verified" stamps; hide review UI when CMS has none | Legal/SDE | ✅ |
| T-04 | Reword absolute claims ("vetted only", "no hidden fees", "never a junior") to what is true; add fee & referral disclosure copy | Legal/Brand | ✅ 🧑 confirm facts |
| T-05 | Partners strip: remove or disclaim ("not affiliated or endorsed") | Legal | ✅ |
| T-06 | Consent model: notice + optional unticked marketing box per channel; store consent wording version/time/source; stop PII in logs; no default `consentGiven: true` | SDE/Legal | ✅ (marketing consent DB columns ⛔ need migration approval) |
| T-07 | Privacy policy rewrite (processors, UAE transfer mechanism, profiling, retention, complaints); fix broken `/cookie-policy` link | Legal | ✅ 🧑 founder to confirm facts |
| T-08 | Cookie policy aligned to reality (Auth.js necessary + opt-in GA4); consent-gate YouTube/Vimeo embeds | Legal/SDE | ✅ |
| T-09 | Terms rewrite: remove consumer indemnity/investment-advice wording; role (introducer vs agent) | Legal | ✅ draft · 🧑 solicitor review |
| T-10 | "Regulation & complaints" block driven by `company-identity.ts` (empty fields render nothing): HMRC AML, redress scheme, CMP, ORN/BRN/Trakheesi | SDE/Legal | ✅ scaffolding · 🧑 values |
| T-11 | One SLA constant for "we reply within…" (currently 2h / 2 working h / 48h in 12 places) | SDE | ✅ (no numeric SLA until confirmed 🧑) |
| T-12 | Investment/yield copy: remove unsourced 4–10% yields; add standard overseas risk warning | Legal/Brand | ✅ |
| T-13 | Accessibility statement + contrast fixes (white/45, gold text) | QA/Design | ✅ |

## Phase 2 — Conversion UX ("crazy easy")
| ID | Task | Owner | Status |
|---|---|---|---|
| C-01 | Hero: depth, one headline, one search (Buy · Rent · Off-plan), mobile-first | Design | ✅ |
| C-02 | Header: glass, slim sticky bar, persistent "Speak to an advisor" CTA | Design | ✅ |
| C-03 | Homepage restructure: proof → how it works → featured → areas → guides → FAQ → CTA, motion via `Reveal` | Design | ✅ |
| C-04 | Property detail: inline enquiry form, WhatsApp with listing context, sticky mobile bar (price + CTA), consent-gated video | RE/SDE | ✅ |
| C-05 | Property cards v2 (image-first, tabular price, 3 facts, one badge) + grid not rows | Design/RE | ✅ |
| C-06 | `/properties`: search, sort, filters (market, type, beds, price), results count, empty states | RE/SDE | ✅ |
| C-07 | `/list-property`: remove false passport/title-deed + "encrypted" claims; surface errors; shorter flow | RE/SDE | 🟡 false claims & uploads removed; flow shortening pending |
| C-08 | Lead modals: single step where possible, honest reassurance, a11y focus management | Design/QA | 🟡 consent/notice done; focus audit pending |
| C-09 | Team/advisor block with real people only (needs founder content) | RE | ⬜ 🧑 |
| C-10 | Buying-guide hubs: Dubai, UK, Bali, Cyprus (area + process + costs) | SEO/RE | ⬜ |
| C-11 | Footer redesign (calm, link-clear, regulatory block) | Design | 🟡 contrast + depth done; layout redesign pending |
| C-12 | Currency selector (AED/GBP/USD/EUR) + typed price fields | RE/SDE | ⛔ needs typed schema fields |

## Phase 3 — SEO & discoverability
| ID | Task | Owner | Status |
|---|---|---|---|
| S-01 | Fix canonical inheritance (`/list-property`, `/auth/*`); `noindex` auth/funnel | SEO | ✅ |
| S-02 | Sitemap real `lastModified`; robots; `llms.txt`; `<html lang="en-GB">` | SEO | ✅ |
| S-03 | JSON-LD: Organization consistency (address/phone), BreadcrumbList, FAQPage; no Offer/Review/Listing markup while unverified | SEO | ✅ |
| S-04 | Property page titles/meta + `Place`/`Residence` structured data | SEO | ✅ |
| S-05 | GA4 referrer/UTM retention + lead conversion events | SEO/SDE | ✅ |
| S-06 | Market/area hub URL map and 12-article calendar (see audit) | SEO | ⬜ |
| S-07 | De-duplicate/fix thin blog posts and Golden Visa metadata (content in Sanity ⇒ **report only**, no CMS edits) | SEO | ⛔ CMS read-only |

## Phase 4 — Engineering, security & QA
| ID | Task | Owner | Status |
|---|---|---|---|
| E-01 | Security headers (CSP, HSTS, Referrer, Permissions), rate-limit/bot protection on APIs, escape email HTML | SDE | ✅ |
| E-02 | Typecheck/lint baseline green; remove dead code; split `header.tsx` (1.3k lines) | SDE | 🟡 lint 0 errors; header split pending |
| E-03 | Tests: Playwright lead funnel + a11y (axe) + unit for lib; GitHub Actions CI | QA | ✅ unit/seo/content tests + CI; Playwright needs browsers |
| E-04 | Health endpoint, error/loading/not-found boundaries, observability | SDE | ✅ |
| E-05 | Performance pass (images, fonts, JS), Lighthouse budget | SDE | 🟡 headers/images done; Lighthouse pass pending |

## Phase 5 — Release gate
Checklist: all T-* items ✅ or explicitly deferred with founder sign-off · `tsc`/`eslint`/tests green · axe clean on top 10 pages · mobile pass at 320/375/768 · no fabricated content (grep gate) · sitemap/robots/canonical verified · founder placeholders list handed over.

## Founder input required (nothing in the site may pretend these exist)
HMRC AML registration · redress scheme + membership no. · Client Money Protection / Rent Smart Wales (if lettings) · Dubai ORN/BRN/Trakheesi · PI cover scope · VAT no. · FCA status (if mortgages/investment mentioned) · evidence for each statistic and consent for each review · true fee & referral arrangements · agent vetting criteria · processor list & DPAs · GTM tag export · developer agreements (if "partners" stays) · image licences · real team bios/photos · privacy/complaints/accessibility contact mailboxes · permission to add typed/permit fields to the Sanity schema.

---
## Wave 2 backlog (next)
1. Founder inputs above → populate `company-identity.ts`, real team page, evidenced stats/reviews, fee page.
2. User approval to extend Sanity `property` schema (tenure, typed price/area, permit/ORN/BRN, brochure) → currency selector, price-band filter, map view.
3. DB migration for marketing-consent columns (`marketingConsent`, `consentTextVersion`, `consentAt`) — needs user approval.
4. Market/area hubs and the 12-article calendar (`audits/seo-marketing.md`); Cyprus content or remove Cyprus from metadata.
5. Split `header.tsx` (1.3k lines); lightbox/caption a11y; Playwright + axe in CI; Lighthouse budget.
6. Sanity-side content hygiene (report only): duplicate escrow/snagging posts → 301s, long `seoDesc`, FAQ text containing "vetted agent / no hidden fees".
7. Remaining transitive `npm audit` highs (Sanity/Prisma dev toolchain) — upgrade Sanity/Prisma in a dedicated change.
