---
name: Haus of Estate Website Restructure
overview: Restructure hausofestate.com from a property-exploration platform into a corporate information / lead-generation landing page. The site becomes a polished brand showcase (who we are, what we offer, who we work with) with lead capture modals triggered by CTAs — no property search, no user accounts, no browsing.
todos:
  - id: cleanup-routes
    content: Delete removed page directories (saved, messages, viewings, search, agent, properties, api/properties)
    status: completed
  - id: header
    content: "Update header: new nav (Home/About/Services/Contact), WhatsApp number top-right, Sign In → modal trigger"
    status: completed
  - id: homepage
    content: "Rewrite homepage sections: hero, trust bar, who are we, what we offer, book a call, videos, reviews, CTA"
    status: completed
  - id: account-modal
    content: Create Account Creation Modal (lead capture with consent)
    status: completed
  - id: buyer-modal
    content: Create Buyer Modal (buy/rent inline questionnaire)
    status: completed
  - id: seller-modal
    content: Create Seller Modal (sell/rent form with file upload)
    status: completed
  - id: list-property-page
    content: Create /list-property standalone page
    status: completed
  - id: api-routes
    content: Create /api/leads and /api/contact routes
    status: completed
  - id: footer
    content: "Update footer: social links, services/company/legal columns, reviews badge"
    status: completed
  - id: bottomnav
    content: Remove BottomNav from (main)/layout.tsx
    status: completed
  - id: build-verify
    content: Build, verify, and test all modals/pages
    status: completed
isProject: false
---

## What Gets Removed

**Pages deleted:**

- `src/app/(main)/saved/` — entire directory
- `src/app/(main)/messages/` — entire directory
- `src/app/(main)/viewings/` — entire directory
- `src/app/(main)/search/` — entire directory (and links to it)
- `src/app/(main)/agent/` — entire directory
- `src/app/(main)/properties/` — entire directory
- `src/app/api/properties/` — entire API route

**Header nav items deleted:**

- `Saved`, `Messages`, `Viewings`, `Search` — removed from `navItems[]` in `[src/components/layout/header.tsx](src/components/layout/header.tsx)`

**Homepage sections deleted** from `[src/app/(main)/page.tsx](src/app/(main)`/page.tsx):

- Video-first featured properties section
- Latest listings grid
- All PropertyGrid / VideoFeed components
- How It Works (4-step discovery-to-close — replace with brand story)

**Footer columns deleted:**

- Platform links (Search Properties, How It Works, For Agents, Pricing) — no platform

**Auth pages:**

- `src/app/(auth)/login/` and `src/app/(auth)/register/` — replaced by a single account creation modal

---

## New Site Architecture

```
/              → Homepage (landing page)
/list-property → Standalone property listing form page
                ↓
            (no /manage-property separate page — link within Thank You state)
```

---

## 1. Header (`[src/components/layout/header.tsx](src/components/layout/header.tsx)`)

**New nav items:** Home | About | Services | Contact

**"Sign In" button** → triggers the Account Creation Modal instead of routing to `/auth/login`

**WhatsApp contact number** displayed top-right (text only, next to sign in button)

**Mobile sheet** updated to match new nav items + Sign In CTA

---

## 2. Homepage (`[src/app/(main)/page.tsx](src/app/(main)`/page.tsx)) — New Sections

### 2a. Hero

- **Headline:** "Your initial step towards a global property portfolio"
- **Sub:** "UK | UAE | International Presence" + "The international real estate you can rely on"
- **Two CTAs:**
  - "Looking to Buy or Rent?" → triggers `BuyerModal`
  - "Sell or Rent Your Property?" → triggers `SellerModal`
- Background: estate-700 green with gold abstract elements (keep current aesthetic)

### 2b. Trust Bar (adapted)

- "15+ Years International Experience" | "RERA & FCA-Regulated" | "Transparent Transactions"

### 2c. Who Are We / What Do We Do?

- Two-column layout: left = brand narrative (who we are), right = developer logos (Emaar, Damac, Binghatti, Taylor Whimpey, BIOM, Barrett Homes)
- Brand copy from questionnaire: "Curating 15+ years of international real estate experience...", "Making each transaction transparent, swift and efficient."
- Developer logos as SVG or text grid — no external links yet

### 2d. What Do We Offer? — Service Toggle

- Two-option toggle: **"Looking to buy or rent?"** | **"Looking to sell or rent?"**
- Each option expands into a short inline form (NOT a modal — this one is inline, right on the page, so there's always something visible)
- **Buy/Rent branch:** Personal or investment use? → Bedrooms? → Area? → "One of our agents shall be in touch"
- **Sell/Rent branch:** No. of bedrooms → Location → Size → View → Urgency (distress/urgent) → File upload (title deed, passport copy)

### 2e. Book a Call

- "Book a video or audio call — for free" with Calendly popup trigger button
- Uses Calendly popup integration (their embed script)

### 2f. Video Content

- Section heading: "Hi, we're Haus of Estate"
- YouTube embed: brand campaign video (placeholder URL: `https://www.youtube.com/embed/YOUR_VIDEO_ID`)
- Below: 2-3 video content posts (Hi I'm Lisa style — placeholder embeds)

### 2g. Reviews Strip (above footer)

- TrustPilot star rating: "4.8 / 5 ★★★★★" with "Excellent" label
- Google rating displayed alongside
- Small review snippet quotes

### 2h. CTA Banner (before footer)

- "Building your pathway to property internationally"
- Single CTA: "Get in Touch" → opens Account Creation Modal

---

## 3. Account Creation Modal (new)

**Trigger:** "Sign In" in header, or "Get in Touch" in homepage CTA

**Fields:**

- First Name *
- Surname *
- Email Address *
- Mobile Number *
- Marketing Consent checkbox: *"I consent to Haus of Estate contacting me via WhatsApp, SMS, email, and phone about properties, investment opportunities, and market updates."*

**On submit:** Success state — "Thank you, [First Name]. Our team will be in touch within 2 hours." No account created, just a lead captured.

**API:** `POST /api/leads` (new route)

---

## 4. Buyer Modal (new) — Triggered from Hero CTA

**Step 1:** "Are you looking to buy or rent?" (Buy / Rent toggle)
**Step 2:** "Personal use or investment?" (Personal / Investment toggle)
**Step 3:** "How many bedrooms?" (1 / 2 / 3 / 4 / 5+)
**Step 4:** "Which area?" (select from market-specific area list)
**Step 5:** "Enter your details and we'll be in touch" → Name, Email, Mobile, Consent tick

**On submit:** Success state, then same as Account Creation

---

## 5. Seller Modal (new) — Triggered from Hero CTA

**Step 1:** "Sell or Rent?" (Sell / Rent toggle)
**Step 2:** Property details: Bedrooms, Location, Size (sqft), View type
**Step 3:** Urgency — "Is it urgent? (Distress sale / Urgent / Not urgent)"
**Step 4:** Document upload: Title deed + Passport copy (file inputs)
**Step 5:** Contact details + Consent tick

---

## 6. Footer (`[src/components/layout/footer.tsx](src/components/layout/footer.tsx)`)

**Updated columns:**

- **Haus of Estate** — logo + description + social links row (YouTube, Facebook, Instagram, X, Snapchat, LinkedIn, TikTok, WhatsApp as icon links)
- **Services** — Buy / Rent / Sell / List Property / Manage Property
- **Company** — About / Careers / Contact
- **Legal** — Privacy Policy / Terms / Cookie Policy

**Reviews badge** — TrustPilot + Google stars displayed above copyright line

---

## 7. New API Routes

### `POST /api/leads` (new)

Captures: firstName, surname, email, mobile, intent (account | buyer | seller), consentGiven, budget?, timeline?, propertyDetails?

Scoring + routing as per funnel API logic.

### `POST /api/contact` (new)

Handles the inline buy/rent and sell/rent form submissions.

---

## 8. New Pages

### `src/app/(main)/list-property/page.tsx`

Standalone full-page form: Sell/Rent branch of the seller modal as a page (for SEO / direct linking). Fields: property type, bedrooms, location, size, view, urgency, file uploads, contact details, consent.

---

## 9. Remove BottomNav

The mobile `BottomNav` component (if it exists in `(main)/layout.tsx`) should be removed since there's nothing for it to navigate to under the new architecture.

---

## Implementation Order

1. Delete old page directories (saved, messages, viewings, search, agent, properties)
2. Update header nav + WhatsApp number display
3. Rewrite homepage sections 1 at a time (hero → trust bar → who are we → what we offer → book a call → videos → reviews → CTA)
4. Create Account Creation Modal
5. Create Buyer Modal
6. Create Seller Modal
7. Create `/list-property` page
8. Create `/api/leads` and `/api/contact` routes
9. Update footer with social links + reviews
10. Update `(main)/layout.tsx` — remove BottomNav
11. Update globals.css if new sections need brand token additions
12. Build + verify

