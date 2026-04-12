# Haus of Estate — Sales Funnel Landing Page PRD

**Document Version:** 1.0  
**Date:** March 27, 2026  
**Author:** Product & Growth Strategy  
**Status:** Draft for Review

---

## 1. Executive Summary

### The Problem
Haus of Estate runs social media campaigns driving traffic to the main homepage. The homepage is built for exploration, not conversion — it has navigation links, multiple CTAs, featured listings, and an "explore" mentality. A visitor arriving from an Instagram ad with purchase intent gets lost in a browsing experience instead of being funnelled toward a qualified lead action.

### The Insight
**Don't build a form. Build a property matchmaking experience.**

A traditional lead-capture form ("Enter your budget, bedrooms, location...") converts at 2–4% in real estate. A multi-step interactive quiz that *feels like getting personalized results* converts at 12–30%. The difference comes down to psychology: forms feel like giving information away, quizzes feel like getting something back.

### The Solution
A standalone landing page at `haus.ae/match` (or `/find-your-property`) that runs a 5-step visual quiz — the **"Property Match"** — collecting buyer intent and preferences through tap-to-select visual cards. Contact information is captured only *after* the user has invested 60–90 seconds in the experience and is shown a preview of their matched results. The page has zero navigation, zero distractions, and one job: turn a social media click into a qualified lead.

### Success Metrics (KPIs)

| Metric | Target | Benchmark |
|--------|--------|-----------|
| Quiz Start Rate (clicks CTA) | > 60% | Industry avg: 40% |
| Quiz Completion Rate | > 70% | Industry avg: 55% |
| Lead Capture Rate (info submitted) | > 45% of completions | Industry avg: 30% |
| Overall Page Conversion Rate | > 18% | Traditional form: 3–5% |
| Cost Per Qualified Lead | < AED 50 | Current benchmark: AED 120+ |
| Lead-to-Viewing Booking Rate | > 25% (within 48hrs) | — |

---

## 2. Strategic Rationale — Why a Quiz, Not a Form

### 2.1 The Psychology at Work

**Commitment & Consistency (Cialdini):** Each tap in the quiz is a micro-commitment. By step 3, the user has invested enough effort that abandoning feels like wasting it. Traditional forms ask for everything upfront — no investment has been made, so there's nothing to lose by closing the tab.

**The Curiosity Gap (Loewenstein):** The quiz creates an open loop: "Your matched properties are being prepared..." The user *needs* to see what they got. This is the same mechanism that makes personality quizzes go viral — people want their result.

**Reciprocity (Cialdini):** We give first (a personalised property matching experience), then ask (your name and WhatsApp). The value exchange feels balanced. A bare form offers nothing before asking for personal details.

**Loss Aversion (Kahneman & Tversky):** Once the user sees "We found 14 properties matching your criteria," giving up their WhatsApp feels trivial compared to losing access to a curated list that took effort to generate.

**The IKEA Effect:** People value things more when they've had a hand in creating them. A property list you helped shape feels more valuable than a generic search page.

### 2.2 Why Not a Traditional Form?

| Traditional Form | Property Match Quiz |
|---|---|
| Feels like work | Feels like a tool |
| All friction upfront | Friction distributed across micro-steps |
| Generic — every visitor sees the same fields | Adaptive — choices shape the experience |
| "Give us your info" | "Let us find your match" |
| Contact info asked first | Contact info asked last (after investment) |
| 3–5% conversion typical | 15–30% conversion achievable |
| Leads are cold | Leads arrive pre-qualified with preferences |

### 2.3 Competitive Advantage

Most Dubai real estate agencies use one of two approaches: (a) a homepage with a search bar, or (b) a WhatsApp "click to chat" button. Neither qualifies the lead before human contact. The Property Match quiz means your agents receive a lead *with context* — they know the buyer's intent, budget, preferred areas, and timeline before the first call. This dramatically shortens the sales cycle and improves agent productivity.

---

## 3. Page Architecture — The Full Flow

### Overview

```
[Social Media Ad] → [Landing Page Hero] → [5-Step Quiz] → [Lead Capture Gate] → [Results Preview + Thank You]
```

The entire experience lives on ONE page. No page reloads, no redirects mid-quiz. Smooth animated transitions between steps give the feeling of a native app.

---

### 3.1 Section 1 — The Hero (Above the Fold)

**Goal:** Stop the scroll. Communicate value. Get the first click.

#### Copy

**Headline:**
> Find Your Perfect Dubai Property in 60 Seconds

**Subheadline:**
> Answer 5 quick questions. We'll match you with verified properties that fit your lifestyle, budget, and goals — curated by our team, not an algorithm.

**CTA Button:**
> Find My Match →

**Trust Bar** (below CTA, single horizontal line):
> ✓ 240+ Verified Listings  ·  ✓ Trusted RERA-Licensed Agents  ·  ✓ Zero Spam, Zero Obligation

#### Design Notes

- Full-viewport hero with a high-quality background image of Dubai skyline at golden hour (slightly blurred to keep text legible).
- NO navigation bar. No hamburger menu. No header links. The logo sits top-left, small, and is not clickable.
- CTA button is large (minimum 56px height on mobile), high-contrast, with a subtle pulse animation to draw attention.
- Progress indicator: a thin line at the very top of the page showing "Step 0 of 5" — this pre-frames the quiz and sets expectations.
- Mobile-first: the hero copy, subhead, and CTA must all be visible without scrolling on a 390px-wide screen.

#### Psychological Triggers in Play

- **"60 Seconds"** — reduces perceived effort (time-anchoring).
- **"We'll match you"** — frames HoE as the active helper, user as the recipient.
- **"curated by our team, not an algorithm"** — differentiates from Bayut/Property Finder; builds trust via human touch.
- **"Zero Spam, Zero Obligation"** — pre-handles the #1 objection (they'll sell my data / call me 50 times).

---

### 3.2 Section 2 — The Quiz (5 Steps)

**Goal:** Collect buyer intent and qualification data through an engaging, visual, low-friction experience.

**UX Principle:** Every step uses **visual card selection** (tap to select), not dropdowns or text inputs. Cards use icons or photos, a short label, and an optional one-line description. Single-select by default; multi-select where noted.

---

#### Step 1 — Intent
**Question:** "What brings you to Dubai real estate?"

| Card | Icon/Visual | Label |
|------|------------|-------|
| A | 🏠 House icon | **Buy my home** |
| B | 📈 Chart icon | **Invest for returns** |
| C | 🌴 Palm tree | **Holiday / second home** |
| D | 🔑 Key icon | **Rent a property** |

**Why this is Step 1:** Intent determines the entire downstream experience. An investor cares about ROI and rental yield; a homebuyer cares about schools and commute. This lets us segment immediately.

**Data captured:** `intent` — used to branch quiz logic and personalise results.

**Transition copy (after selection):** "Great. Let's find the right fit."

---

#### Step 2 — Property Type
**Question:** "What type of property are you looking for?"

| Card | Visual | Label |
|------|--------|-------|
| A | Apartment photo | **Apartment** |
| B | Villa photo | **Villa** |
| C | Townhouse photo | **Townhouse** |
| D | Penthouse photo | **Penthouse** |

**Selection:** Multi-select allowed ("Select all that apply").

**Data captured:** `property_types[]`

**Transition copy:** "Good taste. Now let's talk location."

---

#### Step 3 — Location Preference
**Question:** "Which areas interest you?"

| Card | Visual | Label | Subtitle |
|------|--------|-------|----------|
| A | Marina photo | **Dubai Marina** | Waterfront living |
| B | Downtown photo | **Downtown Dubai** | City centre buzz |
| C | Palm photo | **Palm Jumeirah** | Island lifestyle |
| D | JBR photo | **JBR** | Beach & walk |
| E | Business Bay photo | **Business Bay** | Work-life balance |
| F | — | **Other / Not sure** | We'll help you explore |

**Selection:** Multi-select (up to 3). The "Other / Not sure" option ensures nobody gets stuck.

**Data captured:** `preferred_areas[]`

**Transition copy:** "Almost there — two more quick ones."

---

#### Step 4 — Budget
**Question:** "What's your comfortable budget range?"

| Card | Label |
|------|-------|
| A | **Under AED 1M** |
| B | **AED 1M – 3M** |
| C | **AED 3M – 7M** |
| D | **AED 7M – 15M** |
| E | **AED 15M+** |

**Design:** These are horizontal pill buttons, not photo cards — budget is abstract and doesn't benefit from visuals.

**Data captured:** `budget_range`

**Conditional logic:** If user selected "Rent" in Step 1, this step shows monthly rental ranges instead (Under AED 5K / 5K–10K / 10K–20K / 20K–50K / 50K+).

**Transition copy:** "Last question —"

---

#### Step 5 — Timeline
**Question:** "When are you looking to move forward?"

| Card | Icon | Label |
|------|------|-------|
| A | ⚡ Lightning | **Immediately** (within 30 days) |
| B | 📅 Calendar | **1 – 3 months** |
| C | 🔭 Telescope | **3 – 6 months** |
| D | 💭 Thought bubble | **Just exploring** |

**Data captured:** `timeline`

**Why this matters internally:** This is the lead-scoring multiplier. "Immediately" = hot lead (agent calls within 15 minutes). "Just exploring" = nurture sequence (email drip, no hard sell).

---

#### Quiz UX Specifications

- **Progress bar** at the top fills as the user progresses. Labelled: "Step 3 of 5".
- **Back button** (← arrow) visible on steps 2–5 so users can revise.
- **Auto-advance:** After a selection, there's a 400ms delay with a subtle checkmark animation, then the next step slides in from the right.
- **Mobile:** Cards stack vertically in a 1-column layout. Each card is full-width, minimum 64px tall, with generous tap targets.
- **Desktop:** Cards display in a 2x2 or 3x2 grid depending on the number of options.
- **Animations:** Steps transition with a smooth horizontal slide (like swiping through a carousel). Spring easing, not linear.

---

### 3.3 Section 3 — The Lead Capture Gate

**Goal:** Convert quiz completions into contactable leads. This is the money step.

#### The "Results Loading" Transition

After Step 5, the user sees a brief (2–3 second) animated loading state:

> **Matching your preferences...**
>
> ✓ Checking 240+ verified listings  
> ✓ Filtering by your budget  
> ✓ Curating your personalised shortlist  

Each line checks off sequentially (0.7s apart) with a subtle checkmark animation.

**Why:** This artificial loading state does two things: (1) it creates anticipation and makes the "results" feel earned, not instant, and (2) it gives the brain a moment to register that something valuable is being created for them — which primes them to be willing to share contact details to access it.

#### The Gate

After loading, the screen reveals:

> **Your matches are ready.**
>
> We found **[X] properties** that fit your criteria.  
> Enter your details to see your personalised shortlist.

**Form Fields (3 only):**

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| First Name | Text | Yes | "Your first name" |
| WhatsApp Number | Tel (with country code pre-filled to +971) | Yes | "WhatsApp number" |
| Email | Email | No | "Email (optional)" |

**CTA Button:**
> See My Properties →

**Below the CTA:**
> 🔒 Your details are private. No spam — our agents will reach out once with your personalised list.

#### Why Only 3 Fields

Research consistently shows that every additional form field drops conversion by 5–10%. We need:
- **Name** — to personalise the follow-up ("Hi Sarah, here are your matches...")
- **WhatsApp** — the primary communication channel in Dubai real estate. Higher response rates than email or phone. Pre-filling +971 reduces friction.
- **Email (optional)** — for the nurture drip sequence. Marked optional to reduce friction; ~60% still fill it in.

We deliberately do NOT ask for surname, company, nationality, or any other field. Those are sales qualification questions that belong in the first human conversation, not a landing page.

#### Objection Handling (Micro-copy)

Below the form, in smaller text:

> **What happens next?** A Haus of Estate property specialist will send your matched listings to your WhatsApp within 2 hours. You'll get photos, videos, pricing, and floor plans — no pressure, no obligation.

This does three things: sets response time expectations, describes the value they'll receive, and reinforces the no-pressure positioning.

---

### 3.4 Section 4 — The Thank You / Results Preview

**Goal:** Confirm the action, reduce buyer's remorse, and give an immediate taste of value to build excitement.

After form submission, the user sees:

> **You're in, [First Name]. 🎉**
>
> Your personalised shortlist is being prepared by our team. Expect a WhatsApp message within 2 hours.
>
> **In the meantime, here's a preview of what we found:**

Below this, show 3 property cards from the Haus of Estate inventory that match their quiz selections (or the closest available matches). Each card shows:

- Property image
- Property name and area
- Price
- Bedrooms / sqft
- "Verified" badge

These cards are **blurred after the first one** with an overlay:

> "Unlock your full shortlist — check your WhatsApp."

**Why show a preview:** It validates that the quiz was real and productive ("look, there are actual properties!"). The partial blur creates a final curiosity gap that makes them eager to open the WhatsApp message when it arrives.

#### Secondary CTAs

- **"Browse all properties while you wait →"** — links to the main Haus of Estate search page. This gives impatient users something to do and introduces them to the full platform.
- **"Share with someone who's also looking"** — WhatsApp share button with a pre-filled message: "I just used this tool to find properties in Dubai — try it: [link]". Viral loop.

---

## 4. Copy — Complete Page Copy Document

### Hero
- **Headline:** Find Your Perfect Dubai Property in 60 Seconds
- **Subheadline:** Answer 5 quick questions. We'll match you with verified properties that fit your lifestyle, budget, and goals — curated by our team, not an algorithm.
- **CTA:** Find My Match →
- **Trust line:** ✓ 240+ Verified Listings  ·  ✓ Trusted RERA-Licensed Agents  ·  ✓ Zero Spam, Zero Obligation

### Quiz Step Transitions
- After Step 1: "Great. Let's find the right fit."
- After Step 2: "Good taste. Now let's talk location."
- After Step 3: "Almost there — two more quick ones."
- After Step 4: "Last question —"

### Loading Screen
- Matching your preferences...
- ✓ Checking 240+ verified listings
- ✓ Filtering by your budget
- ✓ Curating your personalised shortlist

### Lead Gate
- **Headline:** Your matches are ready.
- **Subheadline:** We found [X] properties that fit your criteria. Enter your details to see your personalised shortlist.
- **CTA:** See My Properties →
- **Privacy line:** 🔒 Your details are private. No spam — our agents will reach out once with your personalised list.
- **Explainer:** What happens next? A Haus of Estate property specialist will send your matched listings to your WhatsApp within 2 hours. You'll get photos, videos, pricing, and floor plans — no pressure, no obligation.

### Thank You
- **Headline:** You're in, [First Name]. 🎉
- **Subheadline:** Your personalised shortlist is being prepared by our team. Expect a WhatsApp message within 2 hours.
- **Preview label:** In the meantime, here's a preview of what we found:
- **Blur overlay:** Unlock your full shortlist — check your WhatsApp.
- **Secondary CTAs:** Browse all properties while you wait → / Share with someone who's also looking

---

## 5. Lead Scoring & Routing

Every lead submitted through the Property Match page arrives with structured data. Use this to score and route automatically.

### Scoring Matrix

| Signal | Points | Rationale |
|--------|--------|-----------|
| Intent = "Buy my home" | +30 | Highest commitment intent |
| Intent = "Invest for returns" | +25 | High-value client segment |
| Intent = "Holiday / second home" | +20 | Serious but longer cycle |
| Intent = "Rent" | +10 | Lower lifetime value |
| Intent = "Just exploring" | +5 | Nurture, don't push |
| Budget > AED 7M | +25 | High-value deal |
| Budget AED 3M – 7M | +15 | Mid-market sweet spot |
| Budget AED 1M – 3M | +10 | Volume segment |
| Budget < AED 1M | +5 | Starter segment |
| Timeline = "Immediately" | +30 | Hot lead |
| Timeline = "1–3 months" | +20 | Warm lead |
| Timeline = "3–6 months" | +10 | Nurture pipeline |
| Timeline = "Just exploring" | +5 | Long-term nurture |
| Email provided (optional field) | +5 | Higher engagement signal |

### Lead Tiers

| Tier | Score Range | Response Protocol |
|------|------------|-------------------|
| 🔥 **Hot** | 60+ | Agent calls/WhatsApps within 15 minutes. Personalised message with top 3 matched listings. |
| 🟡 **Warm** | 35–59 | Agent WhatsApps within 2 hours with curated list. Follow-up call next business day. |
| 🟢 **Nurture** | < 35 | Automated WhatsApp with listings. Enter 7-day email drip sequence. Agent follows up in 5 days. |

### Routing Rules

- **Palm Jumeirah or Budget > AED 15M** → Route to luxury division
- **"Invest for returns"** → Route to investment advisory team
- **"Rent"** → Route to leasing team
- **Multiple areas selected + "Just exploring"** → Route to general advisory

---

## 6. Post-Conversion Nurture Sequence

The funnel doesn't end at lead capture. Here's the 7-day automated sequence:

### Day 0 (Within 2 hours): WhatsApp — The Shortlist
> "Hi [Name], it's [Agent Name] from Haus of Estate. Based on your preferences, I've put together your personalised shortlist 👇
>
> [3–5 property cards with photos, prices, links]
>
> Would any of these interest you for a viewing? I'm here whenever you're ready — no pressure."

### Day 1: WhatsApp — The Market Insight
> "Quick insight, [Name]: [Area they selected] has seen [X]% in transactions this quarter. Here's a short breakdown of what's moving: [link to market report].
>
> Happy to walk you through what this means for your budget range."

### Day 3: Email — The Content Play
Subject: "Your guide to buying in [Area], [Name]"
Body: Area-specific buyer's guide (localised content) — costs, community vibe, schools, transport, ROI data. Positions Haus of Estate as knowledgeable advisors.

### Day 5: WhatsApp — The Soft Follow-Up
> "Hi [Name], just checking in. Have you had a chance to look at the properties I sent? I also found [1–2 new listings] that just came on the market.
>
> Would you like to schedule a viewing, or would a quick call be easier to narrow things down?"

### Day 7: Email — The Final Nudge
Subject: "Still looking, [Name]? New listings in [Area]"
Body: 2–3 fresh listings + CTA to book a viewing or reply.

After Day 7, the lead enters a monthly newsletter cadence unless they convert to a viewing.

---

## 7. Technical Specifications

### 7.1 Page Architecture
- **Framework:** Next.js (consistent with existing Haus of Estate platform)
- **Route:** `/match` or `/find-your-property`
- **Rendering:** Static generation with client-side quiz logic (no server round-trips during quiz)
- **Load time target:** < 2 seconds on 4G (Dubai mobile networks)

### 7.2 Quiz State Management
- All quiz responses stored in local component state (React useState or useReducer)
- On form submission, POST all data (quiz responses + contact info) to backend API
- If submission fails, retry with exponential backoff; show inline error, do NOT lose quiz state

### 7.3 Integrations
- **CRM:** Push lead data to CRM (HubSpot / Salesforce) via webhook on submission
- **WhatsApp Business API:** Trigger automated first message via WhatsApp Cloud API
- **Analytics:** Track each quiz step as a funnel event in Google Analytics 4 / Mixpanel
  - Events: `quiz_started`, `quiz_step_1_completed`, ..., `quiz_completed`, `lead_submitted`
  - Track drop-off at each step to identify optimisation opportunities
- **UTM Passthrough:** Capture and store UTM parameters from the social media ad URL so every lead is attributed to its source campaign

### 7.4 A/B Testing Points
The following elements should be built with easy variant-swapping in mind:
- Hero headline (test urgency vs. curiosity vs. benefit-led)
- CTA button copy ("Find My Match" vs. "Get My Free Property List" vs. "Start Matching")
- Number of quiz steps (5 vs. 4 — test removing Timeline)
- Lead gate copy (test with/without the "results loading" animation)
- Form field count (test with email required vs. optional vs. removed)

### 7.5 Responsive Breakpoints
- Mobile: 320px – 768px (primary target — 75%+ of social media traffic)
- Tablet: 769px – 1024px
- Desktop: 1025px+

### 7.6 Accessibility
- All quiz cards keyboard-navigable (arrow keys + Enter)
- Focus states clearly visible
- Minimum contrast ratio 4.5:1 on all text
- Screen-reader announcements on step transitions ("Step 2 of 5: Property Type")

---

## 8. Design Direction

### 8.1 Visual Identity
The page should feel premium, clean, and trustworthy — aligned with the existing Haus of Estate brand but stripped of all chrome. Think: Apple product page meets luxury hotel booking.

- **Background:** White or very light warm grey (#FAFAF8)
- **Typography:** Clean sans-serif (the same family used on haus-of-estate). Headline in medium weight, body in regular.
- **Accent colour:** Use the existing Haus of Estate brand accent for CTA buttons and progress bar
- **Photography:** High-quality lifestyle/property images for quiz cards. NOT stock photos with watermarks. Use the actual Haus of Estate listing images where possible.

### 8.2 Quiz Card Design
- Cards have a subtle border (1px, light grey), rounded corners (12px), and a soft shadow on hover
- Selected card gets a bold brand-colour border + checkmark badge in the top-right corner
- On mobile, cards are full-width stacked vertically with 12px gap
- On desktop, cards are in a 2-column grid (Step 1, 4, 5) or 3-column grid (Step 2, 3)

### 8.3 Animations
- Step transitions: horizontal slide, 300ms, ease-out
- Card selection: scale to 0.97 on press, spring back + checkmark fade-in
- Progress bar: smooth width transition, 400ms
- Loading checklist: each line fades in with a staggered 700ms delay, checkmark draws itself with an SVG stroke animation

---

## 9. Risk Assessment & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users abandon at lead capture gate | Lose warm leads | Test a "skip for now" option that shows results but marks lead as uncontacted. Trade-off: fewer captured leads but higher quiz completion. A/B test this. |
| Fake/spam submissions | Wastes agent time | Add basic validation (WhatsApp format check, honeypot field for bots). Do NOT add CAPTCHA — it kills conversion. |
| "Just exploring" leads clog pipeline | Agent burnout | Auto-route to nurture sequence, not live agents. Only escalate if they engage with nurture content. |
| Quiz feels too long | Drop-off mid-quiz | Monitor step-by-step drop-off. If Step 3→4 drop-off > 30%, test merging Location + Budget into one step. |
| Matched properties don't actually match | Trust damage | V1 can use approximate matching (area + budget filter). V2 should have backend logic that genuinely queries inventory. |
| Dubai market-specific: users want to WhatsApp, not fill forms | Lower conversion | The quiz IS the alternative to a form. The contact capture is 2 fields (name + WhatsApp). Position it as "tell us where to send your results." |

---

## 10. Success Measurement — 30/60/90 Day Plan

### Days 1–30: Launch & Learn
- Ship V1 of the Property Match page
- Run initial paid campaign (Instagram + Facebook, AED 5,000 budget)
- Instrument full funnel analytics (step-by-step conversion tracking)
- Baseline all KPIs
- Identify the highest-drop-off quiz step

### Days 31–60: Optimise
- Run A/B tests on the highest-impact elements (headline, CTA, gate copy)
- Test quiz step reduction if drop-off is high
- Refine lead routing based on agent feedback (are Hot leads actually hot?)
- Introduce WhatsApp Business API for automated first response
- Expand ad spend to top-performing campaigns

### Days 61–90: Scale
- Scale ad spend to AED 20,000+/month on winning creative
- Launch separate quiz variants for Investors vs. Homebuyers (different ad → different quiz flow)
- Build retargeting audience from quiz abandoners (people who started but didn't finish)
- Introduce referral program ("Share with a friend" viral loop tracking)
- Begin A/B testing the thank-you page for upsell (viewing booking CTA)

---

## 11. Appendix — Alternative Headlines for A/B Testing

| Variant | Headline | Angle |
|---------|----------|-------|
| A (Control) | Find Your Perfect Dubai Property in 60 Seconds | Benefit + speed |
| B | We've Matched 3,200+ Buyers to Their Dream Home | Social proof |
| C | Your Dubai Property Shortlist — Ready in 5 Questions | Specificity |
| D | Stop Scrolling. Start Shortlisting. | Pattern interrupt |
| E | What Does Your Ideal Dubai Home Look Like? | Question/curiosity |

---

## 12. Appendix — Competitive Differentiation

| Competitor Approach | Weakness | Haus of Estate Advantage |
|---|---|---|
| Bayut / Property Finder search bar | Generic — same experience for everyone. No lead qualification. | Personalised matching; pre-qualified leads with context. |
| Agency WhatsApp "Click to Chat" | No qualification before human contact. Agent wastes time on unqualified leads. | Quiz qualifies before human contact. Agents get full context. |
| Emaar / Developer microsites | Locked to one developer's inventory. | Platform-agnostic; matches across all verified listings. |
| Facebook Lead Form Ads | High lead volume but extremely low quality. No engagement before submission. | Quiz creates engagement and micro-commitment; higher quality leads. |

---

*End of document.*