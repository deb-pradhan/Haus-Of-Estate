# Haus of Estate — System Architecture

> **"Property, with proof."**
> UAE's transaction-first real estate platform.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Application Architecture](#4-application-architecture)
5. [Routing & Page Hierarchy](#5-routing--page-hierarchy)
6. [Data Layer](#6-data-layer)
7. [Domain Model (Entity Relationships)](#7-domain-model-entity-relationships)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [API Layer](#9-api-layer)
10. [Component Architecture](#10-component-architecture)
11. [State Management](#11-state-management)
12. [Email & Notifications](#12-email--notifications)
13. [Lead Capture & Scoring System](#13-lead-capture--scoring-system)
14. [Infrastructure & Deployment](#14-infrastructure--deployment)
15. [Design System](#15-design-system)
16. [Environment Configuration](#16-environment-configuration)
17. [Key Decisions & Trade-offs](#17-key-decisions--trade-offs)
18. [Known Gaps & Roadmap](#18-known-gaps--roadmap)

---

## 1. Project Overview

Haus of Estate is a **transaction-first** real estate platform targeting the UAE (Dubai-primary) market. Unlike traditional listing portals, the platform aims to guide buyers and agents through the full transaction lifecycle: discovery → inquiry → viewing → offer → deal.

**Core differentiators:**
- Verified listings with proof-of-transaction data
- Structured offer/counter-offer negotiation workflow
- Lead scoring and intelligent routing to agents
- Video-first property presentation
- Buyer-agent direct messaging per listing

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.1.6 | App Router, standalone output |
| Language | TypeScript | 5.x | Strict mode |
| UI | React | 19.2.3 | Latest stable |
| Styling | Tailwind CSS | v4 | PostCSS plugin, no config file |
| Components | shadcn/ui + Radix UI | Latest | Customised per brand |
| ORM | Prisma | 7.4.1 | with `@prisma/adapter-pg` |
| Database | PostgreSQL | 15+ | via `pg` driver |
| Auth | NextAuth v5 (beta) | 5.0.0-beta.30 | Credentials + Google OAuth |
| Auth Adapter | @auth/prisma-adapter | 2.11.1 | Session persistence in DB |
| Email | Resend | 6.10.0 | Transactional email |
| Forms | React Hook Form + Zod | 7.x / 4.x | Type-safe validation |
| State | Zustand | 5.0.11 | Client-side global state |
| Icons | Lucide React | 0.575.0 | |
| Fonts | Inter + Cormorant Garamond | — | Google Fonts via next/font |
| Deployment | Docker (standalone) | — | `next build` → `output: standalone` |

---

## 3. Repository Structure

```
/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── (auth)/             # Route group — auth pages (no shared shell)
│   │   ├── (funnel)/           # Route group — lead capture / matching flow
│   │   ├── (main)/             # Route group — main site (header/footer shell)
│   │   ├── api/                # API route handlers
│   │   ├── globals.css         # Global CSS + Tailwind v4 tokens
│   │   └── layout.tsx          # Root layout (fonts, providers)
│   ├── auth.ts                 # NextAuth configuration
│   ├── components/
│   │   ├── agent/              # Agent card components
│   │   ├── layout/             # Header, Footer, BottomNav, Logo
│   │   ├── lead-modal/         # Lead capture modals (Buyer, Seller, Account)
│   │   ├── property/           # Property card, grid, video feed
│   │   ├── search/             # Search filters
│   │   └── ui/                 # shadcn/ui base components
│   ├── data/
│   │   └── mock.ts             # Mock data for development/seeding
│   ├── lib/
│   │   ├── auth/client.ts      # Client-side session hooks
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── email/resend.ts     # Email service functions
│   │   └── utils.ts            # cn() utility
│   ├── proxy.ts                # (Proxy utility — TBD)
│   └── types/
│       └── index.ts            # Shared TypeScript interfaces
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── (migrations/)          # Prisma migration history (not yet generated)
├── public/                     # Static assets (SVGs, logo)
├── docs/
│   ├── ARCHITECTURE.md         # This file
│   └── plans/                  # Implementation plans
├── .env                        # Local env vars (never commit)
├── Dockerfile                  # Production Docker image
├── docker-compose.yml          # Local dev + DB compose
├── next.config.ts              # Next.js config
├── prisma.config.ts            # Prisma accelerate/adapter config
├── components.json             # shadcn/ui registry config
├── Brand-Identity-System.md    # Full brand guidelines
└── PRD.md                      # Product Requirements Document
```

---

## 4. Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│   React 19 + Next.js App Router (Client / Server Components) │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / Server Actions
┌───────────────────────▼─────────────────────────────────────┐
│                    Next.js Server                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  App Router  │  │  API Routes  │  │   NextAuth v5     │  │
│  │  (RSC + SSR) │  │  /api/*      │  │   auth.ts         │  │
│  └──────────────┘  └──────┬───────┘  └────────┬──────────┘  │
│                           │                   │              │
│  ┌────────────────────────▼───────────────────▼──────────┐  │
│  │                    Prisma ORM (v7)                     │  │
│  │              @prisma/adapter-pg                        │  │
│  └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────┘
                            │ TCP/SSL
┌───────────────────────────▼─────────────────────────────────┐
│                   PostgreSQL 15+                              │
│              (Railway / Docker / Supabase)                    │
└─────────────────────────────────────────────────────────────┘

External Services:
  ┌──────────────┐   ┌───────────────────┐
  │   Resend     │   │   Google OAuth    │
  │  (Email)     │   │   (NextAuth)      │
  └──────────────┘   └───────────────────┘
```

### Request Flow

```
Browser Request
  → Next.js Middleware (planned — not yet implemented)
  → Route Group Layout (auth / funnel / main)
  → Page Component (Server Component by default)
    → Data fetch via Prisma (server-side)
    → Render HTML → stream to client
  → Client Components hydrate
    → Zustand store initialised
    → React Hook Form for interactions
```

---

## 5. Routing & Page Hierarchy

```
/                              → (main)/page.tsx        — Homepage
/list-property                 → (main)/list-property/page.tsx
/legal/privacy-policy          → (main)/legal/privacy-policy/page.tsx
/legal/terms-of-service        → (main)/legal/terms-of-service/page.tsx
/legal/cookie-policy           → (main)/legal/cookie-policy/page.tsx
/auth/login                    → (auth)/auth/login/page.tsx
/auth/register                 → (auth)/auth/register/page.tsx
/match                         → (funnel)/match/page.tsx  — Lead capture flow

API Routes:
/api/auth/[...nextauth]        → NextAuth handler (GET + POST)
/api/auth/login                → Custom credentials login + email alert
/api/auth/register             → User registration + lead creation
/api/leads                     → Lead capture with scoring
/api/funnel                    → Funnel step processing
```

### Route Group Layouts

| Group | Layout File | Purpose |
|---|---|---|
| `(main)` | `src/app/(main)/layout.tsx` | Header + Footer shell for main site |
| `(auth)` | `src/app/(auth)/layout.tsx` | Minimal layout for auth screens |
| `(funnel)` | `src/app/(funnel)/match/layout.tsx` | Full-screen funnel layout |

---

## 6. Data Layer

### Prisma Client (`src/lib/db.ts`)

Singleton pattern with `@prisma/adapter-pg` for direct PostgreSQL connection pooling.

```typescript
// Pattern: singleton to avoid multiple connections in dev
const prisma = globalThis.__prisma ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma
```

### Prisma Config (`prisma.config.ts`)

Configures the `@prisma/adapter-pg` driver for connection via the `pg` library.

### Database Indexes

Performance-critical queries are indexed:

| Model | Indexed Fields |
|---|---|
| User | `email`, `role` |
| Property | `slug`, `status`, `agentId`, `propertyType`, `listingType`, `locationArea`, `price` |
| MessageThread | `buyerId`, `agentId` |
| Message | `threadId`, `senderId` |
| ViewingRequest | `propertyId`, `buyerId`, `agentId`, `status` |
| Offer | `propertyId`, `buyerId`, `agentId`, `status` |
| Review | `agentId`, `reviewerId` |
| Notification | `userId`, `read` |
| Lead | `email`, `tier`, `routing`, `createdAt` |

---

## 7. Domain Model (Entity Relationships)

```
User (BUYER | AGENT | ADMIN)
  │
  ├─── AgentProfile (1:1)
  │       │
  │       ├─── Property[] (1:many)
  │       │       │
  │       │       ├─── MessageThread[] ──── Message[]
  │       │       ├─── ViewingRequest[]
  │       │       └─── Offer[] ──────────── OfferEvent[]
  │       │
  │       ├─── Review[] (received)
  │       └─── ViewingRequest[] / Offer[] (agent side)
  │
  ├─── MessageThread[] (as buyer)
  ├─── ViewingRequest[] (as buyer)
  ├─── Offer[] (as buyer)
  ├─── Review[] (written)
  ├─── Notification[]
  ├─── Lead[] (linked lead captures)
  └─── Account[] / Session[] (NextAuth)
```

### Core Enums

```
UserRole:        BUYER | AGENT | ADMIN
PropertyType:    APARTMENT | VILLA | TOWNHOUSE | PENTHOUSE | LAND
ListingType:     SALE | RENT | OFF_PLAN
PropertyStatus:  DRAFT | ACTIVE | UNDER_OFFER | SOLD | RENTED
ViewingStatus:   REQUESTED | CONFIRMED | COMPLETED | CANCELLED
OfferStatus:     OPEN | COUNTERED | ACCEPTED | REJECTED | EXPIRED
ReviewType:      POST_VIEWING | POST_DEAL
```

---

## 8. Authentication & Authorization

### Strategy

NextAuth v5 (beta) with two providers:
1. **Credentials** — email + bcrypt password hash stored in `User.passwordHash`
2. **Google OAuth** — via `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`

Session persistence uses the **Prisma adapter** (`@auth/prisma-adapter`) with database sessions stored in the `Session` model.

### Auth Configuration (`src/auth.ts`)

- Custom `signIn` callback validates credentials against DB
- `session` callback enriches JWT with `user.id` and `user.role`
- `pages.signIn` pointed to `/auth/login`

### Client Hooks (`src/lib/auth/client.ts`)

```typescript
useAuthSession()    // Wraps useSession(), returns { user, status }
useRequireAuth()    // Redirects to /auth/login if unauthenticated
useUserRole()       // Returns current user's role string
```

### Authorization Gaps (Planned)

- No `middleware.ts` exists yet — route protection is not enforced at the edge
- Role-based access control (RBAC) for agent-only and admin-only routes is planned
- See `docs/plans/2026-04-12-user-auth-and-notification-system.md`

---

## 9. API Layer

All API routes live under `src/app/api/` and use the Next.js Route Handler pattern.

### `POST /api/auth/register`

1. Validates input (email, name, password)
2. Checks for existing user
3. Hashes password with `bcryptjs`
4. Creates `User` in DB (role: BUYER by default)
5. Creates associated `Lead` record
6. Sends welcome email via Resend
7. Returns `{ success, userId }`

### `POST /api/auth/login`

1. Validates credentials
2. Sends login alert email (Resend)
3. Returns session token

### `GET|POST /api/auth/[...nextauth]`

Standard NextAuth v5 handler — delegates to `auth.ts` configuration.

### `POST /api/leads`

Lead capture endpoint with scoring logic:

1. Validates payload (intent, contact info, preferences)
2. Runs **lead scoring algorithm** → produces `score` (0–100), `tier` (hot/warm/nurture), `routing` (agent category/area)
3. Upserts `Lead` record in DB
4. Sends admin notification email (Resend)
5. Returns `{ success, leadId, tier }`

### `POST /api/funnel`

Processes multi-step funnel form submissions for the `/match` flow.

---

## 10. Component Architecture

### Layout Components (`src/components/layout/`)

| Component | Responsibility |
|---|---|
| `header.tsx` | Top navigation — logo, search, auth state, CTA |
| `footer.tsx` | Site footer — links, brand copy |
| `bottom-nav.tsx` | Mobile bottom navigation bar |
| `logo.tsx` | Brand logo with CSS module animation |

### Property Components (`src/components/property/`)

| Component | Responsibility |
|---|---|
| `property-card.tsx` | Single listing card — price, type, beds/baths, agent |
| `property-grid.tsx` | Responsive grid of `PropertyCard` components |
| `video-feed.tsx` | TikTok-style vertical video scroll for property tours |

### Lead Capture Modals (`src/components/lead-modal/`)

| Component | Responsibility |
|---|---|
| `modal-context.tsx` | React Context — controls which modal is open |
| `buyer-modal.tsx` | Multi-step form: buyer intent → preferences → contact |
| `seller-modal.tsx` | Seller lead capture form |
| `account-modal.tsx` | Login / register switcher |
| `index.ts` | Barrel export |

### Agent Components (`src/components/agent/`)

| Component | Responsibility |
|---|---|
| `agent-card.tsx` | Agent summary — avatar, rating, agency, response time |

### Search (`src/components/search/`)

| Component | Responsibility |
|---|---|
| `search-filters.tsx` | Filter bar — area, type, listing type, price range, beds |

### UI (`src/components/ui/`)

shadcn/ui base components: `Avatar`, `Badge`, `Button`, `Card`, `Dialog`, `DropdownMenu`, `Form`, `Input`, `Label`, `Popover`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Skeleton`, `Tabs`, `Textarea`, `Tooltip`, `Command`.

---

## 11. State Management

### Zustand (`zustand` v5)

Used for client-side global state. Specific stores are in progress; the library is installed and ready.

Recommended store structure (planned):

```
src/store/
  auth.store.ts       // Mirrors session state for fast reads
  search.store.ts     // Active filters, results
  modal.store.ts      // Lead modal open state (currently React Context)
  ui.store.ts         // Toast queue, loading states
```

### React Context

`modal-context.tsx` currently manages modal open/close state using React Context — a candidate for migration to Zustand for consistency.

### Server State

Data fetching happens in **Server Components** directly via Prisma. No SWR/React Query is currently used. Client-side mutations go through API routes.

---

## 12. Email & Notifications

### Resend Integration (`src/lib/email/resend.ts`)

| Function | Trigger | Recipient |
|---|---|---|
| `sendWelcomeEmail()` | User registers | New user |
| `sendLoginAlertEmail()` | User logs in | Logged-in user |
| `sendLeadNotificationToAdmin()` | Lead captured | `ADMIN_EMAIL` env var |

Templates are currently inline HTML strings — a templating system (React Email) is a logical next step.

### In-App Notifications

The `Notification` model is defined in the schema (userId, title, body, link, read). No UI for notifications is implemented yet — this is a known gap.

---

## 13. Lead Capture & Scoring System

The lead system is one of the most developed business logic pieces.

### Capture Points

1. **Buyer Modal** — intent, market, buy/rent preference, bedrooms, area, urgency, budget, timeline
2. **Seller Modal** — sell/rent intent, property type, location, size, urgency
3. **Registration** — auto-creates a Lead linked to the new User

### Scoring Algorithm (`/api/leads`)

Inputs are weighted to produce a `score` (0–100):

| Signal | Weight |
|---|---|
| Has phone number | High |
| Budget specified | High |
| Timeline < 3 months | Very High |
| Verified email | Medium |
| Specific area given | Medium |
| Multiple sessions | Medium |

### Tier Classification

| Tier | Score Range | Action |
|---|---|---|
| `hot` | 70–100 | Immediate agent call within 1hr |
| `warm` | 40–69 | Agent outreach within 24hrs |
| `nurture` | 0–39 | Email sequence, remarketing |

### Routing

The `routing` field assigns the lead to an agent category or area (e.g., `marina-sales`, `downtown-rent`). This feeds into agent matching logic (planned dashboard feature).

---

## 14. Infrastructure & Deployment

### Docker

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
  → pnpm install + next build

FROM node:20-alpine AS runner
  → Copies standalone output
  → Runs next start
```

`docker-compose.yml` includes the Next.js app + a PostgreSQL service for local development.

### Build Output

`next.config.ts` sets `output: "standalone"` — produces a self-contained Node.js server in `.next/standalone/`.

### Remote Images

Allowed origins configured in `next.config.ts`:
- `images.unsplash.com` (dev/mock images)
- `api.dicebear.com` (avatar generation)

### Planned Deployment Targets

- **Railway** — PostgreSQL database (referenced in auth plan)
- **Vercel** — Next.js hosting (Vercel CLI not yet installed)
- **Docker** — Self-hosted fallback

---

## 15. Design System

### Fonts

| Variable | Font | Usage |
|---|---|---|
| `--font-inter` | Inter | Body text, UI elements |
| `--font-serif-display` | Cormorant Garamond | Display headings, luxury accent |

### Color Philosophy

From `Brand-Identity-System.md`:
- **Primary**: Deep estate green (authority, trust)
- **Accent**: Warm metallic gold (luxury, premium)
- **Background**: Clean warm light (editorial, airy)

All colors are defined as HSL CSS custom properties in `src/app/globals.css` and consumed via Tailwind semantic tokens.

### Design Tokens (`globals.css`)

Custom properties define: color palette, gradients, shadows, transitions, spacing, border radius. All component styles use these tokens — no hardcoded color classes.

### Brand Voice

- 85% serious / 15% witty
- 35% professional / 65% conversational  
- Archetypes: Sage (primary), Caregiver (secondary), Ruler (supporting)

### shadcn Configuration (`components.json`)

```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": { "cssVariables": true },
  "aliases": { "components": "@/components", "utils": "@/lib/utils" }
}
```

---

## 16. Environment Configuration

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth session signing key | Yes — generate: `openssl rand -base64 32` |
| `AUTH_URL` | NextAuth callback base URL | Yes |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | For Google login |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | For Google login |
| `RESEND_API_KEY` | Resend email API key | For transactional email |
| `ADMIN_EMAIL` | Lead notification recipient | For lead alerts |

---

## 17. Key Decisions & Trade-offs

### Next.js App Router (RSC-first)

**Why:** Co-located data fetching in Server Components eliminates round-trips. Excellent for SEO on property listings.

**Trade-off:** NextAuth v5 beta has rough edges; session handling across RSC and Client Components requires careful use of `SessionProvider` + hooks.

### Prisma v7 + `@prisma/adapter-pg`

**Why:** Prisma 7 uses the new driver adapter model for better connection control. `@prisma/adapter-pg` gives direct pg pool management.

**Trade-off:** Prisma v7 with adapter-pg requires explicit `datasource` configuration; some Prisma features (e.g., `@db.Text`) behave differently.

### Tailwind CSS v4

**Why:** Zero config file; CSS-first token system via `globals.css`. Faster iteration.

**Trade-off:** No `tailwind.config.ts` means plugin configuration and custom theme extensions require the `@theme` directive in CSS — less familiar to developers coming from v3.

### NextAuth v5 (beta)

**Why:** Required for Next.js App Router compatibility (edge-ready auth, RSC session access).

**Trade-off:** API is still evolving; breaking changes possible before stable release. Custom `signIn` callback adds complexity.

### Standalone Docker Output

**Why:** Portable deployment, easy Railway/VPS hosting.

**Trade-off:** Cold starts are slower than serverless; must manage PostgreSQL connection pooling carefully (pgBouncer recommended for production).

---

## 18. Known Gaps & Roadmap

### Critical (Before Launch)

| Gap | Priority | Notes |
|---|---|---|
| `middleware.ts` — route protection | High | Auth required on agent dashboard, admin routes |
| Prisma migrations | High | `prisma migrate dev` not yet run; schema exists but no migration history |
| Email templates | Medium | Currently inline HTML; migrate to React Email |
| In-app notification UI | Medium | Model exists; no bell icon / drawer implemented |

### Planned Features

| Feature | Location | Status |
|---|---|---|
| Agent dashboard | `/dashboard/agent` | Not started |
| Admin panel | `/admin` | Not started |
| Property detail page | `/properties/[slug]` | Not started |
| Search results page | `/search` | Not started |
| Messaging UI | `/messages` | Not started |
| Viewing scheduler | `/viewings` | Not started |
| Offer flow UI | `/offers` | Not started |
| Saved properties | `/saved` | Not started |
| Agent public profile | `/agents/[id]` | Not started |
| Push notifications | — | Not started |
| Map view | `/search?view=map` | Not started |
| Off-plan project pages | `/projects/[slug]` | Not started |

### Tech Debt

- `proxy.ts` — purpose undefined, likely leftover
- `src/data/mock.ts` — mock data in `src/` instead of `tests/` or `__fixtures__/`
- No test suite (unit, integration, e2e)
- No error boundaries implemented
- No loading.tsx / error.tsx skeleton files in route segments

---

*Last updated: 2026-04-13*
*Primary author: System Architecture (auto-generated from codebase analysis)*
