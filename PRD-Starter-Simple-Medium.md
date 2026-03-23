# HausofEstate — Starter PRD (Simple + Medium Features)

> **Classification: CONFIDENTIAL — NDA Required**

---

## 1) Product Goal (Phase 1)

Launch a transaction-aware property platform MVP for Dubai that proves:

1. users can discover credible properties faster,
2. buyers and agents can communicate inside the platform,
3. users can move from discovery to viewing to offer without leaving the app.

This phase intentionally excludes heavy compliance and deep automation.

---

## 2) Who This Version Is For

- **Buyers (UAE + overseas):** find verified-looking properties, compare options, contact agents, book viewings, submit offers.
- **Agents:** publish listings, receive qualified inquiries, manage conversations and offers in one place.

---

## 3) In Scope (Simple + Medium Complexity)

## 3.1 Discovery and Listing Experience

| Feature | Complexity | Notes |
|---|---|---|
| Video-first listing feed | Medium | Vertical video cards with basic ranking (newest + featured). |
| Search + filters | Medium | Filter by area, budget, property type, off-plan/secondary. |
| Property detail page | Simple | Video, gallery, key facts, price, agent card, CTAs. |
| Save property | Simple | User can bookmark listings. |
| Compare properties | Medium | Compare selected properties side by side. |

## 3.2 Communication and Viewing Flow

| Feature | Complexity | Notes |
|---|---|---|
| In-app messaging (buyer ↔ agent) | Medium | 1:1 chat threads per property; no WhatsApp dependency. |
| Book viewing request | Medium | User picks preferred slots; agent confirms/rejects. |
| Viewing status tracking | Simple | Requested / Confirmed / Completed / Cancelled. |
| Notifications | Medium | In-app + email for message/viewing/offer updates. |

## 3.3 Offer Workflow (No Escrow)

| Feature | Complexity | Notes |
|---|---|---|
| Make offer | Medium | Structured offer submission with amount + terms text. |
| Counter-offer loop | Medium | Back-and-forth with timeline + status history. |
| Offer state machine | Medium | Open / Countered / Accepted / Rejected / Expired. |

## 3.4 Agent Trust Signals (Basic)

| Feature | Complexity | Notes |
|---|---|---|
| Agent public profile | Simple | Bio, agency, active listings, response time badge. |
| Basic reputation score | Medium | Composite from responsiveness + closed deals on-platform. |
| Post-viewing / post-deal reviews | Medium | Basic star + short text review with moderation queue. |

## 3.5 Account and Admin Basics

| Feature | Complexity | Notes |
|---|---|---|
| User accounts + auth | Medium | Email/phone login, profile, saved properties. |
| Agent listing management | Medium | Create/edit listing, upload media, manage status. |
| Admin listing moderation | Medium | Approve/reject listings and reviews from queue. |
| Basic analytics dashboard | Simple | Core funnel counts: viewings, offers, accepted offers. |

---

## 4) Explicitly Out of Scope (For Later Phases)

- Escrow deposit handling
- In-app payment collection
- Digital MOU generation
- DLD-ready document pack automation
- Full KYC/AML pipeline
- Developer portal + external API products
- Full investor portfolio suite (yield tracking, flip-vs-hold engine)
- Advanced AI (price intelligence, doc verification, risk scoring)

---

## 5) MVP Release Priorities

| Priority | Features |
|---|---|
| **P0 (Must Ship)** | Video feed, property detail, search/filter, messaging, viewing requests, basic agent profile, auth |
| **P1 (Next)** | Offer/counter-offer flow, save/compare, notifications, basic reputation, review system |
| **P2 (After PMF Signal)** | Better analytics, smarter feed ranking, expanded moderation tooling |

---

## 6) Success Metrics for This Starter Version

- % of listings with usable video
- Message reply time (buyer → agent)
- Viewing request-to-confirmation rate
- Conversion: property view → message → viewing request
- Conversion: viewing completed → offer submitted
- Offer acceptance rate

---

## 7) Suggested Technical Baseline (Lean)

- **Frontend:** Next.js web app (mobile-first UI)
- **Backend:** Node.js API (modular monolith to move fast)
- **Database:** Postgres
- **Media:** Object storage + CDN for listing videos/images
- **Search:** Postgres full-text first; dedicated search engine later
- **Notifications:** Email provider + in-app notification table

---

## 8) Rollout

1. Launch in **Dubai only**.
2. Onboard a small quality-controlled agent cohort.
3. Focus on inventory quality and response speed before scale.

---

> **Document Version**: 1.0-starter  
> **Date**: February 2026  
> **Status**: Draft — Simplified MVP Scope
