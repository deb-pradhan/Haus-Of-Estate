# HausofEstate — Product Requirements Document

> **Classification: CONFIDENTIAL — NDA Required**
> This document and all associated concepts, architecture, and features are proprietary. Do not distribute, replicate, or discuss outside of authorized parties.

---

## 1. Vision

**HausofEstate** is an AI-powered, transaction-first, trust-based property ecosystem for the UAE real estate market.

It is **not** a listing site.

It is the **full lifecycle platform** — from discovery → verification → negotiation → deal → move-in — all in one place.

### Strategic Positioning

> *"We are the safest, smartest, and most trusted way to buy property in the UAE."*

We don't compete on volume of listings. We compete on **trust, transaction completion, and user experience**. That message resonates globally.

---

## 2. Problem Statement

| Pain Point | Current State |
|---|---|
| Listings are stale, unverified, and duplicated | Property Finder, Bayut, Dubizzle all suffer from this |
| No transaction layer — platforms sell leads, not outcomes | Agents spam buyers on WhatsApp; no accountability |
| No single platform serves end-users, investors, developers, and overseas buyers | Fragmented tools, spreadsheets, and PDFs |
| Agent quality is opaque | No reputation tied to real deal data |
| Gen Z and international buyers expect video-first, mobile-native UX | Current platforms are photo galleries with PDFs |
| Payments, escrow, and legal docs are handled offline | Friction kills deals |

---

## 3. Target Users

| Persona | Needs |
|---|---|
| **End-user buyers** (UAE residents) | Verified listings, video walkthroughs, in-app booking, trusted agents |
| **Investors** (local + overseas) | ROI calculators, rental yield tracking, portfolio dashboard, flip vs hold analysis |
| **Overseas buyers** | Video-first discovery, escrow security, end-to-end digital transaction |
| **Developers** | Off-plan project distribution, API access, analytics |
| **Agents** | Lead quality, reputation building, deal management tools |

---

## 4. Core Platform Pillars

### 4.1 Transaction Engine (The Killer Move)

Property Finder makes money from leads. **HausofEstate makes money from transactions.**

| Feature | Description |
|---|---|
| **In-app chat** | No agent WhatsApp spam. All communication auditable and in-platform. |
| **Offer & counter-offer system** | Structured negotiation flow with timestamps and history. |
| **Booking deposits in escrow** | Platform holds deposits securely until conditions are met. |
| **Digital MOU generation** | Auto-generated Memorandum of Understanding from deal terms. |
| **DLD-ready document packs** | Pre-packaged docs formatted for Dubai Land Department submission. |
| **In-app payment collection** | Clients can pay booking fees directly during/after viewings. Instant, frictionless. |

### 4.2 Video-First Property Discovery

Every property listing **must** include:

- **30–60 sec vertical video** (agent intro + walkthrough)
- TikTok-style scrolling feed for browsing
- **Save / Compare / Book Viewing** CTAs on every card

This captures Gen Z, international buyers, and anyone who's tired of scrolling through 40 identical photos.

### 4.3 Off-Plan + Secondary + Investor Dashboard

One platform for all property types and all user types.

**Investor Tools:**

| Tool | Function |
|---|---|
| ROI Calculator | Project expected returns based on purchase price, rent, appreciation |
| Rental Yield Tracking | Live yield data tied to actual market rents |
| Portfolio Dashboard | Unified view of all owned/tracked properties |
| Flip vs Hold Analysis | Model both exit strategies with real market data |

Nobody in the UAE does this well yet.

### 4.4 Agent Reputation System

Each agent profile displays:

| Metric | Description |
|---|---|
| **Deal completion score** | % of started deals that closed |
| **Response speed** | Average time to first response |
| **Verified transactions count** | Real, platform-verified deal count |
| **Client reviews** | Reviews tied to **actual completed deals** only |

Bad agents disappear. Good agents become brands. Power shifts from portals to trust.

### 4.5 AI Layer

| Capability | Application |
|---|---|
| Smart matching | AI recommends properties based on user behavior, budget, and preferences |
| Price intelligence | Flag overpriced/underpriced listings based on market data |
| Document verification | Auto-verify listing docs (title deed, NOC, etc.) |
| Chatbot / concierge | Guide users through the transaction flow |
| Risk scoring | Flag suspicious listings or agents with anomalous patterns |

---

## 5. Monetization Model

**Lower barrier → faster adoption → network effects.**

No expensive monthly listing packages. Instead:

| Revenue Stream | Model |
|---|---|
| **Per-transaction success fee** | % of deal value on completed transactions |
| **Verified listing credits** | Agents pay to get listings verified and badged |
| **Developer API access** | Developers pay for distribution + analytics |
| **Featured video placements** | Promoted video listings in the feed |
| **Mortgage referrals** | Commission from mortgage broker partners |
| **Conveyancing referrals** | Commission from legal/conveyancing partners |
| **Valuation referrals** | Commission from valuation service partners |
| **Investor premium dashboards** | Subscription tier for advanced analytics |

---

## 6. Platform Architecture

### 6.1 High-Level Site Map

```
HausofEstate
│
├── 🏠 Home / Discovery Feed
│   ├── Video-first scrolling feed (TikTok-style)
│   ├── AI-powered recommendations
│   ├── Search & filters (area, type, budget, off-plan/secondary)
│   └── Featured / promoted listings
│
├── 🔍 Property Detail
│   ├── Video walkthrough player
│   ├── Photo gallery
│   ├── Pricing & payment plan
│   ├── Verified badge + document status
│   ├── Agent profile card (with reputation score)
│   ├── Save / Compare / Book Viewing / Make Offer
│   ├── ROI calculator (investor mode)
│   └── Similar properties
│
├── 💬 Messaging & Negotiation
│   ├── In-app chat (buyer ↔ agent)
│   ├── Offer / counter-offer flow
│   ├── Document sharing
│   └── Viewing scheduler
│
├── 💰 Transaction Hub
│   ├── Deal tracker (status pipeline)
│   ├── Escrow deposit management
│   ├── Digital MOU generation
│   ├── DLD document pack builder
│   ├── Payment gateway (booking fees, deposits)
│   └── Completion & handover flow
│
├── 📊 Investor Dashboard
│   ├── Portfolio overview
│   ├── ROI calculator
│   ├── Rental yield tracker
│   ├── Flip vs hold analyzer
│   ├── Market insights & trends
│   └── Watchlist / alerts
│
├── 👤 Agent Portal
│   ├── Listing management (upload video, docs)
│   ├── Lead management
│   ├── Deal pipeline
│   ├── Reputation score & reviews
│   ├── Verified credits purchase
│   └── Performance analytics
│
├── 🏗️ Developer Portal
│   ├── Project listings (off-plan)
│   ├── Payment plan builder
│   ├── API access & analytics
│   ├── Agent assignment
│   └── Buyer funnel dashboard
│
├── 👤 User Account
│   ├── Profile & preferences
│   ├── Saved properties
│   ├── Comparison board
│   ├── Transaction history
│   ├── Documents vault
│   └── Notifications & alerts
│
└── ⚙️ Admin / Back-office
    ├── Listing verification queue
    ├── Agent verification & KYC
    ├── Escrow management
    ├── Dispute resolution
    ├── Revenue & commission tracking
    └── AI model management
```

### 6.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  Mobile App   │  │   Web App    │  │  Developer / Agent Portal │ │
│  │  (iOS/Andr.)  │  │  (Next.js)   │  │       (Web Dashboard)     │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬──────────────┘ │
└─────────┼──────────────────┼──────────────────────┼─────────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                  │
│              (Authentication, Rate Limiting, Routing)                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐
│  CORE SERVICES   │ │ TRANSACTION SVC  │ │     AI / ML SERVICES     │
│                  │ │                  │ │                          │
│ • Listings       │ │ • Offer Engine   │ │ • Recommendation Engine  │
│ • Search/Filter  │ │ • Escrow Mgmt   │ │ • Price Intelligence     │
│ • User Mgmt     │ │ • MOU Generator  │ │ • Doc Verification       │
│ • Agent Profiles │ │ • DLD Doc Pack   │ │ • Risk Scoring           │
│ • Messaging      │ │ • Payment GW     │ │ • Smart Matching         │
│ • Video CDN      │ │ • Deal Pipeline  │ │ • Chatbot / Concierge    │
│ • Notifications  │ │                  │ │                          │
└────────┬─────────┘ └────────┬─────────┘ └────────────┬─────────────┘
         │                    │                        │
         ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ Primary   │  │ Search   │  │  Object   │  │   Analytics /     │ │
│  │ Database  │  │ Index    │  │  Storage  │  │   Data Warehouse  │ │
│  │ (Postgres)│  │(Elastic) │  │  (S3/CDN) │  │   (ClickHouse)   │ │
│  └──────────┘  └──────────┘  └───────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     THIRD-PARTY INTEGRATIONS                        │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │  DLD API  │  │ Payment  │  │ Mortgage  │  │   KYC / Identity  │ │
│  │ (Dubai    │  │ Gateway  │  │ Partners  │  │   Verification    │ │
│  │  Land     │  │ (Stripe/ │  │  API      │  │   (Jumio/Onfido)  │ │
│  │  Dept)    │  │  Lean)   │  │           │  │                   │ │
│  └──────────┘  └──────────┘  └───────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Transaction Flow

```
Buyer discovers property (video feed / search)
        │
        ▼
  Book Viewing ──→ Pay viewing deposit (optional) ──→ Attend viewing
        │
        ▼
  Make Offer ──→ Counter-offer loop (in-app) ──→ Offer accepted
        │
        ▼
  Booking Deposit ──→ Held in platform escrow
        │
        ▼
  MOU Generated ──→ Digital signatures ──→ Both parties sign
        │
        ▼
  DLD Document Pack ──→ Auto-generated, compliance-checked
        │
        ▼
  Mortgage (if applicable) ──→ Referred to partner ──→ Approved
        │
        ▼
  Transfer / Registration ──→ DLD submission
        │
        ▼
  Completion ──→ Keys handed over ──→ Deal closed
        │
        ▼
  Reviews ──→ Both parties review each other ──→ Agent reputation updated
```

---

## 7. MVP Scope (Phase 1)

| Feature | Priority |
|---|---|
| Video-first listing feed | P0 |
| Property detail pages with video | P0 |
| Agent profiles with basic reputation | P0 |
| In-app messaging (buyer ↔ agent) | P0 |
| Book viewing + payment | P0 |
| Offer / counter-offer system | P0 |
| Escrow deposit holding | P1 |
| Digital MOU generation | P1 |
| Investor ROI calculator | P1 |
| AI recommendations | P1 |
| Full investor dashboard | P2 |
| Developer portal + API | P2 |
| DLD document packs | P2 |
| Agent KYC + full verification | P2 |

---

## 8. Key Metrics

| Metric | Why It Matters |
|---|---|
| **Deals closed on platform** | Core business metric — we monetize transactions |
| **Time to close** | Platform efficiency |
| **Agent response time** | Trust & UX |
| **Video engagement rate** | Feed stickiness |
| **Escrow volume** | Transaction confidence |
| **NPS (buyer + agent)** | Platform satisfaction |
| **Conversion: view → offer → close** | Funnel health |

---

## 9. Competitive Moat

| Competitor | Their Model | Our Advantage |
|---|---|---|
| Property Finder | Lead gen (sell contacts to agents) | We close deals, not sell leads |
| Bayut / Dubizzle | Listing volume | We verify & transact |
| Zillow (US model) | iBuying / ads | We own the full flow in UAE context |
| None in UAE | Investor-grade analytics | First mover on investor dashboard |
| None in UAE | Video-first feed | First mover on TikTok-style property discovery |

---

## 10. Technical Considerations

- **Video infrastructure**: Transcoding pipeline for agent uploads → optimized vertical video delivery via CDN
- **Escrow compliance**: UAE RERA regulations for holding client funds — likely requires partnership with licensed escrow provider
- **KYC/AML**: Identity verification for all transacting parties (agents, buyers, developers)
- **DLD integration**: API or data feed from Dubai Land Department for transaction verification
- **Payment gateway**: UAE-licensed payment processor (Lean Technologies, Stripe UAE, Network International)
- **Data residency**: UAE data protection laws — hosting within UAE or compliant jurisdictions

---

## 11. Go-to-Market

1. **Launch in Dubai only** — highest volume, most international buyer interest
2. **Onboard 50–100 top agents** with verified deal histories — they seed the supply side
3. **Video content blitz** — partner with property videographers to create launch inventory
4. **Target overseas buyers first** — they have the most pain (can't visit, don't trust agents, need escrow)
5. **Expand to Abu Dhabi, then Sharjah** after Dubai PMF

---

> **Document Version**: 1.0
> **Date**: February 2026
> **Status**: Draft — Pre-development
> **Confidentiality**: Under NDA
