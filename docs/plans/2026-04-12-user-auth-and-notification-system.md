# User Auth & Notification System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement NextAuth.js v5 (Auth.js) + Railway PostgreSQL + Resend email notifications. All user data flows through Prisma. No ghost state, no duplicate leads, no silent failures.

**Architecture:**
- Auth: NextAuth.js v5 with Prisma adapter + Railway PostgreSQL
- Sessions: JWT strategy (stateless) + database sessions for security-sensitive ops
- Email: Resend transactional emails (welcome, login alerts, lead notifications to agents)
- Lead persistence: Unified `Lead` model captures all modal submissions, keyed by email
- Password: bcrypt (via Prisma), never stored raw

---

## Task 1: Prisma Schema — Extend User + New Lead Model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add missing models**

```prisma
// Add after model Notification (line 283):

model Account {
  id                String  @id @default(cuid())
  userId            String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider          String  // "google" | "credentials"
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires   DateTime

  @@unique([identifier, token])
}

model Lead {
  id             String    @id @default(cuid())
  email          String
  firstName      String
  surname        String?
  phone          String?
  intent         String    // "account" | "buyer" | "seller"
  market         String?
  buyOrRent      String?
  useType        String?
  bedrooms       String?
  area           String?
  sellOrRent     String?
  propertyType   String?
  location       String?
  size           String?
  viewType       String?
  urgency        String?
  budget         String?
  timeline       String?
  score          Int       @default(0)
  tier           String?   // "hot" | "warm" | "nurture"
  routing        String?
  consentGiven   Boolean   @default(false)
  source         String?   // "modal" | "page" | "api"
  userId         String?   // link to User if they later register
  notifiedAt     DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([email])
  @@index([tier])
  @@index([routing])
  @@index([createdAt])
}

// Extend User model — add these fields after existing ones:
model User {
  // ... existing fields ...
  accounts     Account[]
  sessions     Session[]
}
```

**Step 2: Update existing User model** — ensure it has `accounts` and `sessions` relations:

```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  phone          String?
  avatar         String?
  role           UserRole @default(BUYER)
  passwordHash   String?
  emailVerified  Boolean  @default(false)
  savedListings  String[] @default([])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  accounts        Account[]
  sessions        Session[]
  // ... existing relations ...
}
```

**Step 3: Run migration**

```bash
cd /Users/deb/Projects/Haus\ Of\ Estate
npx prisma migrate dev --name add_auth_and_lead_models
```

Expected: Migration creates `Account`, `Session`, `VerificationToken`, `Lead` tables.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add NextAuth tables + unified Lead model"
```

---

## Task 2: Environment Variables

**Files:**
- Modify: `.env`

**Step 1: Add all required vars**

```env
# DATABASE (Railway PostgreSQL)
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Google OAuth (get from console.cloud.google.com)
AUTH_GOOGLE_ID="xxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxx"

# Resend (get from resend.com)
RESEND_API_KEY="re_xxx"
ADMIN_EMAIL="admin@hausofestate.com"
```

**Step 2: Commit**

```bash
git add .env
git commit -m "chore: add auth and Resend env vars"
```

---

## Task 3: NextAuth Configuration

**Files:**
- Create: `src/auth.ts` (root-level config)
- Create: `src/lib/auth/client.ts` (client-side session helpers)
- Create: `src/lib/email/resend.ts` (email sender)
- Modify: `src/app/api/auth/[...nextauth]/route.ts`

**Step 1: Create `src/auth.ts`**

```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "email-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.emailVerified = (user as any).emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
});
```

**Step 2: Create `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

**Step 3: Create `src/lib/email/resend.ts`**

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Haus of Estate <noreply@hausofestate.com>";
const ADMIN = process.env.ADMIN_EMAIL!;

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Haus of Estate",
    html: `<h1>Welcome, ${name}</h1>
<p>Thank you for joining Haus of Estate. Your account has been created successfully.</p>
<p>We'll be in touch within 2 hours with property opportunities tailored to your needs.</p>`,
  });
}

export async function sendLoginAlertEmail(to: string, name: string, device: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "New login to your Haus of Estate account",
    html: `<p>Hi ${name},</p>
<p>We noticed a new sign-in to your account.</p>
<p><strong>Device/Browser:</strong> ${device}</p>
<p>If this wasn't you, please contact us immediately.</p>`,
  });
}

export async function sendLeadNotificationToAdmin(lead: {
  email: string;
  firstName: string;
  intent: string;
  tier: string;
  score: number;
  phone?: string;
}) {
  const tier_emoji = lead.tier === "hot" ? "🔥" : lead.tier === "warm" ? "📈" : "🌱";
  return resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `${tier_emoji} New ${lead.tier?.toUpperCase()} Lead: ${lead.firstName} (${lead.intent}) — Score: ${lead.score}`,
    html: `<h2>New Lead Notification</h2>
<table style="border-collapse:collapse">
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.firstName}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.email}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.phone ?? "—"}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Intent</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.intent}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Tier</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.tier?.toUpperCase()}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd"><strong>Score</strong></td><td style="padding:8px;border:1px solid #ddd">${lead.score}</td></tr>
</table>`,
  });
}
```

**Step 4: Commit**

```bash
git add src/auth.ts src/lib/email/resend.ts "src/app/api/auth/[...nextauth]/route.ts"
git commit -m "feat: add NextAuth config + Resend email lib"
```

---

## Task 4: Registration API — Email/Password

**Files:**
- Create: `src/app/api/auth/register/route.ts`

**Step 1: Create route**

```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendWelcomeEmail, sendLeadNotificationToAdmin } from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const { name, email, password, phone, intent, consentGiven } = await request.json();

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // ── Duplicate check ─────────────────────────────────────────────────────────
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // ── Password hash ───────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 14);

    // ── Lead scoring (reuse existing logic from /api/leads) ─────────────────────
    let score = 10;
    if (intent === "buyer") score += 30;
    else if (intent === "seller") score += 25;
    const tier = score >= 60 ? "hot" : score >= 35 ? "warm" : "nurture";

    // ── Transaction: create user + lead record ──────────────────────────────────
    const [user, lead] = await db.$transaction([
      db.user.create({
        data: { name, email, phone: phone ?? null, passwordHash },
      }),
      db.lead.create({
        data: {
          email,
          firstName: name,
          intent: intent ?? "account",
          consentGiven: consentGiven ?? true,
          tier,
          score,
          source: "modal",
        },
      }),
    ]);

    // ── Async email notifications ─────────────────────────────────────────────────
    sendWelcomeEmail(email, name).catch(console.error);
    sendLeadNotificationToAdmin({
      email, firstName: name, intent: intent ?? "account", tier, score, phone,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: add registration API with lead capture + email notifications"
```

---

## Task 5: Login API with Login Alert

**Files:**
- Modify: `src/app/api/auth/login/route.ts` (replace existing mock)

**Step 1: Replace login route**

```typescript
import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { sendLoginAlertEmail } from "@/lib/email/resend";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, password, device } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Send login alert email (async, non-blocking)
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      sendLoginAlertEmail(email, user.name, device ?? "Unknown device").catch(console.error);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/login/route.ts
git commit -m "feat: add login API with login alert email"
```

---

## Task 6: Rewrite `/api/leads` — Persist + Notify

**Files:**
- Modify: `src/app/api/leads/route.ts`

**Step 1: Replace with persistent implementation**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLeadNotificationToAdmin } from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      intent, firstName, surname, email, mobile, consentGiven,
      buyOrRent, useType, bedrooms, area, market,
      sellOrRent, propertyType, location, size, viewType, urgency,
    } = body;

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!firstName || !email || !mobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!consentGiven) {
      return NextResponse.json({ error: "Consent required" }, { status: 400 });
    }

    // ── Lead scoring (same logic as funnel route) ────────────────────────────────
    let score = 0;
    if (intent === "buyer") score += 30;
    else if (intent === "seller") score += 25;
    else score += 10;

    if (useType === "investment") score += 15;
    if (urgency === "distress") score += 25;
    else if (urgency === "urgent") score += 15;

    const tier = score >= 60 ? "hot" : score >= 35 ? "warm" : "nurture";

    // ── Routing ─────────────────────────────────────────────────────────────────
    let routing = "general";
    if (market === "dubai" && (area === "palm" || buyOrRent === "buy")) routing = "luxury";
    else if (intent === "invest") routing = "investment";
    else if (buyOrRent === "rent" || sellOrRent === "rent") routing = "leasing";

    // ── Check for existing lead by email (merge upsert) ─────────────────────────
    const existingLead = await db.lead.findFirst({ where: { email } });

    const leadData = {
      firstName,
      surname: surname ?? null,
      email,
      phone: mobile ?? null,
      intent: intent ?? "account",
      market: market ?? null,
      buyOrRent: buyOrRent ?? null,
      useType: useType ?? null,
      bedrooms: bedrooms ?? null,
      area: area ?? null,
      sellOrRent: sellOrRent ?? null,
      propertyType: propertyType ?? null,
      location: location ?? null,
      size: size ?? null,
      viewType: viewType ?? null,
      urgency: urgency ?? null,
      score,
      tier,
      routing,
      consentGiven,
      source: "modal",
    };

    const lead = existingLead
      ? await db.lead.update({ where: { id: existingLead.id }, data: { ...leadData, updatedAt: new Date() } })
      : await db.lead.create({ data: leadData });

    // ── Async admin notification ─────────────────────────────────────────────────
    sendLeadNotificationToAdmin({
      email, firstName, intent: intent ?? "account", tier, score, phone: mobile,
    }).catch(console.error);

    return NextResponse.json({ success: true, tier, score, leadId: lead.id });

  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/leads/route.ts
git commit -m "feat: persist leads to DB + send admin email notifications"
```

---

## Task 7: Client Auth Hook — Session State

**Files:**
- Create: `src/lib/auth/client.ts`

**Step 1: Create client-side session helper**

```typescript
"use client";
import { SessionContext, SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";

export { SessionProvider };
export const useAuthSession = useSession;

// Convenience hooks
export function useRequireAuth() {
  const { data: session, status } = useSession();
  return { session, status, isLoading: status === "loading", isAuthenticated: !!session };
}

export function useUserRole() {
  const { data: session } = useSession();
  return (session?.user as any)?.role ?? "BUYER";
}
```

**Step 2: Add SessionProvider to root layout**

```typescript
// In src/app/layout.tsx:
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

**Step 3: Commit**

```bash
git add src/lib/auth/client.ts src/app/layout.tsx
git commit -m "feat: add client-side auth session hooks"
```

---

## Task 8: Rewrite Login/Register Pages — Real Auth

**Files:**
- Modify: `src/app/(auth)/auth/login/page.tsx`
- Modify: `src/app/(auth)/auth/register/page.tsx`

**Step 1: Rewrite login page**

Replace `handleSubmit` mock with:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, device: navigator.userAgent }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    router.push("/");
  } catch {
    setError("Something went wrong");
  } finally {
    setLoading(false);
  }
};
```

**Step 2: Rewrite register page**

Replace `handleSubmit` mock with actual API call to `/api/auth/register` following the same pattern.

**Step 3: Commit**

```bash
git add src/app/\(auth\)/auth/login/page.tsx src/app/\(auth\)/auth/register/page.tsx
git commit -m "feat: connect login/register pages to real auth APIs"
```

---

## Task 9: Protect Routes — Middleware

**Files:**
- Create: `src/middleware.ts`

**Step 1: Create middleware**

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED = ["/saved", "/messages", "/viewings", "/account", "/properties"];

// Routes only for unauthenticated users
const GUEST_ONLY = ["/auth/login", "/auth/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;

  // Redirect authenticated users away from guest-only pages
  if (isAuth && GUEST_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect unauthenticated users to protected pages
  if (!isAuth && PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add route protection middleware"
```

---

## Task 10: Install Dependencies

**Files:**
- Modify: `package.json`

```bash
npm install bcryptjs resend @auth/prisma-adapter
npm install -D @types/bcryptjs
```

**Commands to verify:**
```bash
npm run build   # must pass
npm run lint    # must pass
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add bcryptjs, resend, auth/prisma-adapter dependencies"
```

---

## Edge Cases Covered

| Edge Case | Handling |
|---|---|
| Duplicate email registration | 409 conflict returned, no DB duplicate |
| Duplicate lead (same email) | Upsert — updates existing lead record |
| Login with wrong password | 401, no session created |
| Password < 8 chars | Pre-validation, 400 returned |
| Invalid email format | Pre-validation, 400 returned |
| Missing consent | 400 returned before any DB write |
| Registration before lead | `userId` link created if user later registers with same email |
| Login alert fails | Non-blocking `.catch(console.error)`, user still logged in |
| Admin email fails | Non-blocking, lead still saved |
| JWT token tampered | NextAuth rejects automatically |
| Session expired | NextAuth handles refresh, middleware redirects |
| User deletes account | `onDelete: Cascade` removes sessions, leads |
| Google OAuth token expired | NextAuth handles refresh automatically |

---

## Test Scenarios

1. **Register new user** → user record created, lead record created, welcome email sent, admin notified
2. **Register duplicate email** → 409 returned, no duplicate
3. **Login correct credentials** → session set, login alert email sent
4. **Login wrong password** → 401, no session
5. **Submit buyer modal** → lead saved with score/tier, admin notified
6. **Submit seller modal (same email)** → lead upserted, score recalculated, admin notified
7. **Access protected route unauthenticated** → redirects to `/auth/login`
8. **Access `/auth/login` authenticated** → redirects to `/`
9. **Build passes** → `npm run build` exits 0

---

## Revert

```bash
git reset --hard HEAD~1
# Repeat per commit to undo sequentially
```

---

## Files Summary

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Extended with Account, Session, VerificationToken, Lead |
| `.env` | DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_*, RESEND_API_KEY, ADMIN_EMAIL |
| `src/auth.ts` | NextAuth config with Google + Credentials |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth handlers |
| `src/app/api/auth/register/route.ts` | Registration with password hash + lead |
| `src/app/api/auth/login/route.ts` | Login with credential check + login alert |
| `src/app/api/leads/route.ts` | Lead capture with persistence + upsert + notify |
| `src/lib/email/resend.ts` | Welcome, login alert, admin lead notifications |
| `src/lib/auth/client.ts` | Client-side session hooks |
| `src/middleware.ts` | Route protection |
| `src/app/layout.tsx` | Wrapped in SessionProvider |
| `src/app/(auth)/auth/login/page.tsx` | Connected to real login API |
| `src/app/(auth)/auth/register/page.tsx` | Connected to real register API |

**Verification commands:**
```bash
npm install
npx prisma migrate dev --name add_auth_and_lead_models
npm run build
npm run lint
```

---

## Notes

- **Resend free tier:** 100 emails/day. Admin lead notifications are low volume (a few per day). Welcome emails per registration. Login alerts per login event. Within limits for early-stage app.
- **Password reset:** NextAuth Credentials provider handles this automatically with email verification flow. Can add explicit reset flow later if needed.
- **Google OAuth:** Requires OAuth consent screen setup on Google Cloud Console. Test locally first with http://localhost:3000.
- **Railway PostgreSQL:** Connection string format: `postgresql://user:password@host:port/db`. Add `?schema=public` if needed.
- **No new deps without reason:** bcryptjs (8.3kB), resend (400kB), @auth/prisma-adapter (9kB). All justified by auth requirements.
