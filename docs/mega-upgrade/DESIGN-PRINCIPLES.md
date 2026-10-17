# Haus of Estate — Design Principles (v2, "Quiet Confidence")

Owner: Web Designer + Brand Manager + Visual/Motion Designer. Status: adopted on branch `mega-upgrade`.

This is **not** Apple's design system. We borrow the *principles* Apple uses to make
complex products feel effortless, and express them in the Haus of Estate brand
(Estate Green, Signature Gold, warm paper; Sage / Caregiver / Ruler archetypes;
UK English; "Property, with proof.").

## 1. The seven principles

| # | Principle | What it means on hausofestate.com | Rule of thumb |
|---|-----------|-----------------------------------|---------------|
| 1 | **Clarity** | Every screen answers one question. Large type, plain words, one obvious next step. | One primary CTA per viewport. If two things compete, remove one. |
| 2 | **Deference** | The property and the proof are the hero; chrome steps back. | Photography/data first. UI is translucent, hairline, quiet. |
| 3 | **Depth** | Layers, not borders. Soft shadow + blur communicate hierarchy and context. | Surfaces: canvas → card → floating (glass). No heavy outlines. |
| 4 | **Generous space** | Whitespace is a premium signal and a comprehension tool. | Sections breathe: 96–128 px desktop, 64–80 px mobile. |
| 5 | **Direct, purposeful motion** | Motion explains cause and effect; never decorates. Springy, short, interruptible. | 180–500 ms; transform/opacity only; honour `prefers-reduced-motion`. |
| 6 | **Consistency** | Same component = same behaviour everywhere. A small, strict token set. | No one-off hex codes, radii or shadows in components. |
| 7 | **Accessibility is the design** | 44 px targets, ≥4.5:1 text, visible focus, keyboard-first, readable at 200 % zoom. | If it fails contrast or focus, it is not finished. |

## 2. Tokens

### Colour (extends `Brand-Design-System.md`)
- **Estate Green 700 `#1F4F2F`** — primary action, headings on paper, hero surface.
- **Estate Green 900 `#0F2A19`** *(new)* — deep hero/footers, dark glass.
- **Signature Gold 500 `#A88D63`** — *decorative only* (rules, icons, large display accents on dark). Contrast on paper is **2.58:1 — never use for body-size text**.
- **Gold 700 `#76603A`** *(new)* — gold **text** on paper/white (4.90:1 / 5.99:1). Eyebrows, links, labels.
- **Gold 400 `#C4A87A`** — gold on dark green (4.16:1: large text/icons only).
- **Paper `#ECE8E0` → `#F5F2EC`** *(softened canvas, new `--canvas-soft`)*, surface white, hairline `rgba(30,31,33,.08)`.
- Gold-filled buttons use **Ink `#1E1F21`** text (5.23:1), not white (3.16:1 fails).
- Status: Trust Teal `#2F7A73` (verified), Action Amber `#C18A2D` (sparingly), Destructive `#B3261E`.

### Typography
- Display: **Cormorant Garamond** (Canela fallback per brand) — weight 500, tracking `-0.015em`, tight leading.
- UI/body: **Inter** — body 17 px/1.55 (reading), UI 15 px, caption 13 px.
- Fluid scale (`clamp`): `display` 44→84 px, `title-1` 34→56, `title-2` 28→40, `title-3` 22→28, `lede` 18→22.
- Eyebrows: 12 px, uppercase, `0.18em`, Gold 700 on light / Gold 400 on dark.
- Numerals in data (price, yield, size) use `tabular-nums`.

### Shape, elevation, material
- Radii: control 12 px · card 20 px · panel/hero 28 px · pill ∞.
- Elevation: `e1` hairline+2 px, `e2` 8 px/24 px soft, `e3` 24 px/64 px (floating). Shadows are tinted with Estate Green at low alpha, never pure black.
- Glass: `backdrop-blur(20px) saturate(1.6)` on `rgba(255,255,255,.72)` (light) / `rgba(15,42,25,.55)` (dark). Always paired with a hairline border for legibility.

### Spacing & layout
- 4 px base grid; section rhythm `--section-y: clamp(4rem, 8vw, 8rem)`.
- Content max width 1200 px (reading 68 ch). 16 px mobile gutters minimum.
- Mobile first. Bottom-anchored primary actions on small screens.

### Motion
- Easing: `--ease-out-expo: cubic-bezier(.16,1,.3,1)`, `--ease-spring: cubic-bezier(.34,1.56,.64,1)`.
- Durations: 120 (press) / 220 (hover, toggle) / 420 (reveal) / 700 (hero entrance).
- Patterns: scroll-reveal (fade + 16 px rise, staggered 60 ms), press = `scale(.98)`, card hover = 4 px lift + shadow e2→e3, image hover = 1.03 scale max.
- Never animate layout properties; never autoplay motion that cannot be paused; reduced-motion = instant.

### Controls
- Min target 44×44 px. Buttons: default 44 px, large 52 px, **pill** for primary/secondary CTAs.
- Inputs: 48 px, 12 px radius, 1 px hairline, 3 px focus ring in Estate Green at 35 %.
- Focus: always visible (`:focus-visible`), 2 px ring + 2 px offset.

## 3. Voice (applied to UI copy)
- Lead with the fact, then the benefit. Specific proof beats adjectives.
- Calm, precise, discreetly premium. Never "best ever", "guaranteed", fake urgency.
- UK diction: *enquiry*, *estate agent*, *mobile*, *flat*, *completion*, *freehold*.
- Buttons are verbs: "Request a viewing", "Speak to an advisor", "See properties".

## 4. Page-level patterns
- **Hero**: full-bleed image or deep-green field, one headline (≤ 9 words), one sentence, one search/CTA. Social proof below the fold, not competing.
- **Section header**: eyebrow → title-2 → lede. Left-aligned on content pages, centred on marketing bands.
- **Property card**: image 4:3 first, price in tabular numerals, location, three key facts, one tertiary action. No more than one badge on the image.
- **Forms**: one question per screen on mobile funnels, progressive disclosure, inline validation, reassurance line under the primary button (what happens next, who replies, when).
- **Proof**: every number on the site must have a source or be removable. Quantities that cannot be evidenced are not shown.

## 5. Definition of done (design)
1. Passes WCAG 2.2 AA contrast, focus, target size.
2. Works at 320 px, 768 px, 1280 px, 1920 px; no horizontal scroll.
3. Uses tokens only. 4. Reduced-motion respected. 5. Loads without layout shift.
