# Mega Upgrade — Change History

Trackable log of every change on branch `mega-upgrade`. Newest first. Each entry: date · area · what changed · why (audit ref) · files.
Roadmap: `ROADMAP.md`. Audits: `audits/`.

## 2026-10-18

### Trust & compliance
- **T-01 `/match` funnel made honest** (legal P0-8, RE audit). Removed `Math.random()` match count, fake "matching…" loader, invented "Verified" sample listings with prices and blurred "unlock" cards, `haus.ae` share link, "5 quick questions" overclaim. Submit now checks `response.ok` and shows an error instead of a false success. Added privacy-policy link, honest "what happens next". Page set `noindex`.
  Files: `src/app/(funnel)/match/page.tsx`, `src/app/(funnel)/match/layout.tsx`.

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
