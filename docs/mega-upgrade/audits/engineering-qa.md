# Engineering / Security / QA Audit — Haus of Estate (branch `mega-upgrade`)

Audited: 2026-10-18. Method: read-only (tsc, eslint, node --test, npm audit, curl against the dev server on :3457, grep). No source edited, no build run.
Caveat: the dev server is `next dev`, so TTFB/payload numbers are dev-mode indicative only; bundle sizes could not be measured (no `next build` allowed).

## 0. Baseline numbers

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 14 errors, **1 real** (`src/lib/db.ts(1,10)` `PrismaClient` not exported: `prisma generate` not run locally; Dockerfile runs it). 13 are stale-`.next` artefacts (`.next/types/validator.ts` references routes that do not exist on this branch: `buy-property-*`, `trust`, `analytics-test`, `api/markdown`; plus `.next/types` vs `.next/dev/types` mismatch). tsc is only trustworthy after `rm -rf .next` + `prisma generate`. |
| `npm run lint` | **96 problems: 74 errors, 22 warnings.** Rules: `react/no-unescaped-entities` 37 (legal pages, match funnel, modals), `no-require-imports` 21 (all in `scripts/*.js`), `no-explicit-any` 14, `no-unused-vars` 21 (W), `react-hooks/set-state-in-effect` 1 (`TableOfContents.tsx:48`), `react-hooks/static-components` 1 (`search-filters.tsx:273`, dead component). Top files: `(funnel)/match/page.tsx` 12, legal pages 29, `scripts/` ~25, `sanity/types.ts` 5. |
| `npm run test:seo` | 8/8 pass |
| `npm run test:careers-offline` | 3 pass, 1 skipped (needs `HAUS_CAREERS_TEST_URL`; never runs in CI) |
| `blog-publication`, `property-media`, `property-publication` tests | 14/14 pass (not wired to any npm script) |
| Playwright (`tests/browser/*`) | 2 specs, analytics only; need full `npm run build`; not run |
| `npm audit --omit=dev` | **52 vulns: 4 critical, 27 high, 20 moderate, 1 low** (see S-2) |
| `git ls-files \| grep '^\.env'` | empty. `.env`, `.env.local`, `.env.docker` are NOT tracked and were never in history. OK. |
| Tracked files | **46,593, of which 46,341 are `studio-haus-of-estate/node_modules/**`**; `.git` = 400 MB (see Q-1) |
| Error boundaries | `not-found.tsx` only. **No `error.tsx`, `global-error.tsx`, `loading.tsx`** anywhere under `src/app` |

---

## P0 — fix before any launch / do now

### P0-1 Lead capture silently drops leads, and the funnel never persists anything
Evidence:
- `src/app/api/funnel/route.ts:105-122` only `console.log`s the lead (name, phone, email = PII in stdout) then returns `success:true`; `// TODO: Persist via Prisma / CRM / WhatsApp`. Nothing is stored or emailed. Prisma `Lead` has `budget`, `timeline` columns that no route writes.
- `src/app/(funnel)/match/page.tsx:1150-1170`, and `lead-modal/{buyer,seller,account}-modal.tsx` (`buyer-modal.tsx:116-135`): `fetch` result is never checked (`res.ok` ignored; `catch (_) {}`), then success screen is shown. Proof: on this machine `POST /api/leads` currently throws at module load (500, Prisma client not generated) and the UI would still say "thank you".
- `/api/leads` depends on a live Postgres + Resend; if either is down the user still sees success (`leads/route.ts:113-119` returns 500, ignored by client).
Fix: (a) persist funnel leads (reuse `/api/leads` logic via a shared `lib/leads.ts`); (b) client must check `res.ok`, show an error + WhatsApp/phone fallback; (c) write-ahead: store the lead first, email second (already so in `/api/leads`); (d) alert on 5xx (see D-3). Effort: M.

### P0-2 Fabricated result on the match funnel
Evidence: `match/page.tsx:1169` `const count = Math.floor(Math.random() * 8) + 4;` and `:873` renders "We found N properties that match your criteria in Dubai". This is invented data. It conflicts with the brand rule that Haus of Estate is NOT authorised to list properties (lead routing only) and is a trading-standards / ASA risk. Route `/match` is not in the sitemap but is publicly reachable.
Fix: replace with deterministic copy ("A specialist will contact you within 2 hours"); remove `matchCount` state. Effort: S.

### P0-3 No security headers at all
Evidence: `next.config.ts` has no `headers()`; `curl -D- localhost:3457/` returns only `X-Powered-By: Next.js` and `Cache-Control`. Missing: CSP, HSTS, X-Frame-Options/`frame-ancestors`, Referrer-Policy, Permissions-Policy, X-Content-Type-Options. Clickjacking of the lead modals is possible today.
Fix: add `headers()` (config in section 6 of this doc, CSP must allow `googletagmanager.com`, `google-analytics.com`, `cdn.sanity.io`, `images.unsplash.com`, `data:`/`blob:` imgs; start in `Content-Security-Policy-Report-Only`), set `poweredByHeader:false`. Studio route `/studio` needs its own relaxed CSP. Effort: S–M.

### P0-4 Next.js 16.1.6 + Auth.js beta have known critical/high advisories, one of which defeats the careers takedown
Evidence: `npm audit`: `next` range `<16.4.2` fix available non-major (16.4.2): "Middleware/Proxy bypass in App Router via segment-prefetch routes" (high, `<16.2.6`), DoS with Server Components (high, `<16.2.5`), image-optimiser DoS / unbounded disk cache, CSRF null-origin bypass, request smuggling in rewrites. `src/proxy.ts` is the sole mechanism that 404s `/careers/**` (docs/urgent-careers-closure) — a proxy-bypass advisory undermines that. `next-auth@5.0.0-beta.30` / `@auth/core<=0.41.2`: "existence-based auth checks fail open on config errors" (critical), email-normaliser homoglyph bypass (critical). `prisma` high via `@prisma/config`; `resend` via `svix`→`uuid` moderate.
Fix: `npm i next@16.4.2 eslint-config-next@16.4.2` (pin both, currently exact 16.1.6), `npm i next-auth@latest @auth/prisma-adapter@latest prisma@latest @prisma/client@latest resend@latest`; re-run careers-offline test against a local build. `undici`/`uuid` hits come via `sanity` studio (dev-time, not runtime server) — lower priority; consider moving `sanity`, `@sanity/vision` to devDependencies if Studio is hosted separately. Effort: M (regression run needed).

### P0-5 `studio-haus-of-estate/node_modules` (46,341 files, ~400 MB `.git`) is tracked in git
Evidence: `git ls-files | grep -c node_modules/` = 46341. Slows clones/CI/Railway builds, leaks nothing secret but contains darwin-arm64 binaries (`esbuild`). `.gitignore` anchors `/node_modules` to repo root only, so the nested one is not ignored.
Fix: `git rm -r --cached studio-haus-of-estate/node_modules`, add `node_modules/` (unanchored) to `.gitignore`; optionally history-rewrite (BFG) after team agreement. Effort: S (untrack), M (rewrite).

---

## P1 — high

### P1-1 API input validation is ad hoc; Prisma filter injection and lead overwrite
- `zod` is a dependency but has **0 imports** in `src/`. `leads/route.ts:8-34` destructures untyped JSON; only presence checks. No type, length, enum or email-format validation (register has a regex; leads does not).
- `leads/route.ts:62` `db.lead.findFirst({ where: { email } })` with `email` unvalidated. A JSON object (`{"contains":""}`/`{"not":"x"}`) becomes a Prisma operator filter; and even with a string, anyone who submits a victim's email **overwrites that lead's name/phone/preferences** (`:88-92`). Lead identity should be append-only (insert new row or merge only empty fields).
- `leads` stores whatever strings are sent (unbounded length) -> storage/log abuse; `bedrooms` as object -> 500.
Fix: shared `zod` schemas (`z.strictObject`, trimmed, `max()`, `z.enum` for intent/market/etc., `z.email()`, `libphonenumber-js` for mobile), `safeParse` -> 400 with field errors; lower-case emails; insert-only (or `upsert` on normalised email without overwriting contact fields). Effort: M.

### P1-2 No rate limiting / bot protection on any write endpoint
Evidence: no limiter anywhere (`grep -ri ratelimit src` = 0). Only the careers form has a honeypot (`applications/route.ts:45`); `/api/leads`, `/api/funnel`, `/api/auth/register`, `/api/auth/login` have none. Consequences: lead-form spam floods the admin mailbox (each lead triggers `sendLeadNotificationToAdmin`) and burns Resend quota; credential stuffing on `/api/auth/login` (no lockout); `register` runs `bcrypt.hash(pw, 14)` (~1 s CPU each) unauthenticated = cheap CPU DoS.
Fix: per-IP + per-email sliding window (Upstash Redis or Postgres table; in-memory fails across Railway replicas), Cloudflare Turnstile on lead + register + login, honeypot + min-time-to-submit on all forms, drop bcrypt cost to 12 and cap password length (72 bytes, bcrypt truncates). Effort: M.

### P1-3 HTML injection in transactional email (phishing vector from our own domain)
Evidence: `src/lib/email/resend.ts:37` `<h1>Welcome, ${name}</h1>`, `:54` `Hi ${name}`/`${device}` (device comes straight from the client JSON in `login/route.ts:36`), and `sendLeadNotificationToAdmin` `:170-178` interpolates `firstName`, `email`, `phone`, `intent` unescaped, plus `mailto:${lead.email}`. The careers mails correctly use `escapeHtml` (`:90-133`) — the lead/auth ones do not. Attack: `POST /api/auth/register` with victim's address as `email` and `name` containing `<a href=evil>` -> victim receives a branded "Welcome" mail from `noreply@hausofestate.com` with attacker markup; admin inbox gets attacker HTML in lead alerts. Subject lines interpolate `firstName` (`:179`); Resend takes JSON so classic CRLF header injection is not possible, but strip `\r\n` anyway.
Fix: apply `escapeHtml` everywhere, strip control chars from subject, move templates to one function. Effort: S.

### P1-4 Auth hardening gaps
- No email verification: `register` creates a usable account for any address (pre-hijack of a victim's address; welcome mail to non-owner).
- User enumeration: `register` returns 409 "An account with this email already exists" (`register/route.ts:33`); `authorize` returns early when user missing (`auth.ts:38`) so response time leaks existence (no dummy `bcrypt.compare`).
- Emails case-sensitive (`findUnique({email})`) -> duplicates; normalise to lower-case on write and read.
- `login/route.ts` sends a login-alert email on every successful sign-in and trusts client-supplied `device` string; alert emails are a spam amplifier.
- `src/proxy.ts:17-19` guards guest-only pages by cookie *presence* with v4 + secure names only (misses `authjs.session-token` on http); redirect target is a fixed `/` (no open redirect). OK but not a security boundary — **there is no authenticated route in the app yet** (no `admin/`, `saved/`, `viewings/` pages exist; those dirs are empty). Do not expose account UI until verified.
- `AUTH_TRUST_HOST` not set anywhere (`.env.example`, Dockerfile, railway.json): Auth.js v5 behind Railway's proxy needs `AUTH_TRUST_HOST=true` or `trustHost:true`, else `UntrustedHost` at runtime. Verify on staging.
- Google provider gets `""` creds when env unset (`auth.ts:22`) rather than failing fast.
Effort: M.

### P1-5 No `error.tsx` / `global-error.tsx` / `loading.tsx`; Sanity errors swallowed
Evidence: only `src/app/not-found.tsx`. `sanityFetch` (`src/sanity/client.ts:26-37`) catches every error and returns `{data:null}`. With ISR (`revalidate = 60`) a transient Sanity outage during a background revalidation regenerates the page with empty data and **replaces the good cached page**; detail pages call `notFound()` on null -> a cached 404 for up to 60 s and Google sees a 404 for a live property. Also hides errors from monitoring.
Fix: for ISR pages `throwOnError:true` (Next keeps serving last good page when regeneration throws), add `app/error.tsx`, `app/global-error.tsx`, route-level `loading.tsx` for `/properties`, `/blog`; distinguish "empty" from "failed" in UI. Effort: M.

### P1-6 `/api/revalidate/path` weaknesses
`revalidate/path/route.ts:9` non-constant-time compare and fails open if `SANITY_REVALIDATE_SECRET` is an empty string and header sent empty (`"" === ""`); accepts any `path` string (any route purgeable by anyone holding the secret — fine) but no length/format check; no tag-based invalidation, so webhook must send explicit paths for every dependent page (homepage, listing, sitemap). Fix: `timingSafeEqual`, require secret length > 16, validate `path` startsWith('/'), switch to `revalidateTag` with tagged `fetch` (client.fetch `next:{tags}`) so one webhook covers lists + detail. Effort: S–M.

---

## P2 — medium

### P2-1 Performance / caching architecture
- Root layout is `async` and awaits `draftMode()` (`src/app/layout.tsx:158`) although no draft-enable route exists (no `/api/draft`). In Next 16 this makes every route read a request-bound API; confirm in a prod build that `/`, `/properties/[slug]`, `/blog/[slug]` are `●` (ISR/SSG) in the build table, not `ƒ`. If dynamic, move `draftMode` into a tiny `<Suspense>` child (the preview badge only) and out of `ConsentManager` props.
- `/blog` and `/properties` read `searchParams` (blog/page.tsx:39, properties/page.tsx:26), so `revalidate = 60` is moot: they SSR on every request with 2-3 uncached Sanity queries (`useCdn:false`, `client.ts:8`). Measured (dev): `/blog` TTFB ~0.44 s on every hit vs `/` 0.04 s cached. Use `useCdn:true` for published reads, wrap Sanity calls in `unstable_cache`/`fetch` tags, or make filters client-side with a static shell.
- Search `q` is interpolated into GROQ `pt::text(body) match $q` (`blog/page.tsx:57`) with no length cap/rate limit: expensive full-body scans, cost/DoS vector. Cap length (<=64), strip operators, rate limit.
- `POST_FIELDS` computes `round(length(pt::text(body))/1125)` for every post in lists — projects whole body text per row. Store `readMins` at publish time.
- Property image pipeline: 19 MB of originals in `public/properties` (3.3 MB single jpeg); served through `next/image` OK but `images.formats` not set (add `['image/avif','image/webp']`), no `minimumCacheTTL`; remote pattern `api.dicebear.com` is unused (remove) and Unsplash is used for funnel tiles (`match/page.tsx:165`) -> prefer self-hosted.
- LCP: homepage HTML has 4 `<img>`, **0 with `fetchPriority="high"/priority`**; hero is text over a colour/gradient (good for LCP, `h1` is the LCP element) — but `/properties/[slug]` and `/blog` heroes use lazy images; add `priority` to the first above-the-fold image only. Dev HTML sizes: `/` 357 KB (209 KB inline RSC payload), `/properties` 161 KB, `/blog` 173 KB, property detail 248 KB — homepage RSC payload is heavy; re-measure on a prod build.
- Fonts: `next/font/google` Inter + Cormorant (4 weights, `display:swap`) self-hosted by Next — good, preloaded via `Link` header. Unused `@font-face "Canela"` with `local()` (`globals.css:7-12`) is dead. Trim Cormorant to the weights used.
- Third parties: GA4/GTM injected only after consent via `document.createElement` (`lib/analytics.ts:200-216`) — good (no CLS/INP cost pre-consent). `react-phone-number-input` CSS is loaded on `/properties` and `/blog` (preload seen in `Link`) because modal is in layout; lazy-load the lead modal tree (`next/dynamic`) to keep it off the critical path.
- INP/hydration: `header.tsx` (1,352 lines, `"use client"`) is one client module containing mega-menu data, 3 menus, mobile nav, contact bar. It hydrates on every page. Assessment: most of it is static markup (utility bar, mobile nav lists, mega-menu panels) -> split into a server `Header` shell + small client islands (`NavDropdown`, `PropertiesMegaMenu`, `MobileSheet`); expected to cut the layout's shared JS materially. `footer.tsx` is also `"use client"` solely for 3 `onClick={openBuyer/Seller}` — replace with a tiny `<OpenModalButton>` client island. `about/page.tsx` (850 lines) is `"use client"` for two `openAccount` clicks -> should be server. `services-toggle.tsx` 1,431 lines client; review. `content-visibility:auto` used once (`(main)/page.tsx:211`) — extend to below-fold homepage sections and blog grid, with `contain-intrinsic-size`.
- `Reveal` (`ui/reveal.tsx`) hides content until IntersectionObserver fires — content is in DOM (OK for SEO) but with JS slow/off elements stay `opacity:0`; ensure CSS default is visible under `@media (scripting:none)` / `noscript`.

### P2-2 Dead code and duplicated logic
- Never imported: `components/property/{property-grid,video-feed}.tsx`, `agent/agent-card.tsx`, `search/search-filters.tsx` (has a lint error), `ui/{command,tabs,tooltip,scroll-area,popover,avatar,form,dropdown-menu}.tsx`, empty dirs `components/{funnel,messaging}`, `app/{admin,agent,compare,messages,saved,search,viewings,properties/[id]}`.
- `src/data/mock.ts` (608 lines, dubai Unsplash/dicebear URLs) is imported only for `formatPrice` by `property-card.tsx` (itself reachable only via dead `property-grid`). Not shipped to prod pages today, but it is a leak risk (mock listings contradict "no listings") -> delete, move `formatPrice` to `lib/utils`.
- `src/sanity/fallbackImages.ts`: 5 hard-coded Unsplash images keyed by blog slug, used in `BlogCard`, `FeaturedPost`, `blog/[slug]/page.tsx:73`. If a post lacks a featured image the site shows an unrelated stock photo — it does leak into production by design. Replace with a branded neutral placeholder.
- Unused deps (0 imports): `zod`(!), `@hookform/resolvers`, `zustand`, `date-fns`, `react-icons`, `@sanity/vision` (src); `cmdk`/`react-hook-form` only in dead UI. Remove after zod decision.
- Duplicated lead scoring + routing logic in `leads/route.ts`, `funnel/route.ts`, `register/route.ts` with *different* intent vocabularies (`buyer/seller` vs `buy/invest/holiday/rent`) and score formulas. Extract `lib/leads/score.ts` + unit tests.
- Three near-identical modal forms (buyer/seller/account, 396/432/~250 lines) duplicate fetch+validation; extract `useLeadSubmit()`.
- Duplicated `<main>`: `(main)/layout.tsx:14` renders `<main id="main-content">`, and `blog/page.tsx:125` + `blog/[slug]/page.tsx:234` render another `<main>` inside (invalid, confirmed: 2 `<main>` in /blog HTML). Change inner to `<div>`/`<section>`.

### P2-3 CMS & data layer
- GROQ is generally projected (no `...` over entire docs) and parameterised — good. `POST_FIELDS` spreads `featuredImage{...}` fine.
- No tags / `next:{revalidate}` on `client.fetch`; relies purely on page-level `revalidate=60` plus a path webhook. Add tags (`post`, `property`, `faq`, `role`) and a webhook `{_type}` -> `revalidateTag`.
- `generateStaticParams` calls swallow errors (`properties/[slug]/page.tsx:73`): on Sanity failure at build time you ship zero pre-rendered properties without failing the build. Fail the build (`throwOnError:true`) for static params.
- `projectId` falls back to hard-coded `'jdxbkry4'` (`client.ts:6`); a missing env in a preview deployment silently reads production data. Fail fast outside dev.
- Empty states: `empty-state-cta.tsx` exists for properties; blog list empty/failed states indistinguishable (see P1-5).
- Sitemap: `lastModified: now` for every URL on every request (sitemap.ts:30) defeats crawl signals — use `_updatedAt` from Sanity. `/properties/[slug]` entries and `/properties/{residential,commercial}` verify present. Sitemap TTFB 1.1 s in dev (2 uncached Sanity queries) — cache it (`export const revalidate = 3600`).
- `robots.ts` OK (`/api/`, `/studio/` disallowed); `/match`, `/auth/*` not disallowed/noindex — add `noindex` to `(auth)` and funnel result.

### P2-4 Accessibility (WCAG 2.2 AA), code-level
Computed contrast ratios (WCAG relative luminance):
| Pair | Ratio | Verdict |
|---|---|---|
| `gold-500 #a88d63` on canvas `#ece8e0` | **2.58** | FAIL (needs 4.5; even 3.0 UI-component bar fails) |
| gold-500 on white | 3.16 | FAIL for text (<4.5), passes only for large/UI |
| gold-500 on paper-soft `#f5f2ec` | 2.82 | FAIL |
| gold-500 on estate-700 `#1f4f2f` | 3.00 | FAIL for text |
| gold-500 on estate-900 `#0f2a19` | 4.87 | pass |
| gold-400 `#c4a87a` on estate-700 | 4.16 | FAIL (just) for small text; ok >=24px |
| gold-400 on estate-900 | 6.76 | pass |
| gold-700 `#76603a` on canvas / white | 4.90 / 5.99 | **pass — use this for text** |
| slate-700 on canvas | 6.46 | pass |
| mist-400 `#b8bdc2` on canvas | 1.55 | FAIL (decorative only) |
| white on estate-700 | 9.47 | pass |
| ink-900 on canvas | 13.50 | pass |
| palm-sage / copper-clay on canvas | 3.09 / 2.88 | FAIL for text |
`text-gold-500` is used 54 times, mostly for small uppercase eyebrow labels at 11-14 px (`(main)/page.tsx:65,87`, `about/page.tsx` x8, `blog/page.tsx:130`, `faq/page.tsx:130`). Fix: define `--color-gold-text: #76603a` (4.90:1 on canvas) and use `text-gold-700` for text on light backgrounds; keep gold-500 for borders/icons on dark; on `estate-700` use gold-300 (`#d9c49c`, ~6:1).
Other code-level findings:
- Landmarks: one `header`/`nav`/`main`/`footer`/`h1` per page (good) except the nested `<main>` on blog pages (P2-2); skip link present (`layout.tsx:177`) and target `#main-content` exists.
- Header nav dropdowns use `role="menu"`/`aria-haspopup="menu"` (`header.tsx:448,897`) — ARIA menu pattern requires arrow-key menuitem semantics; for site navigation use the disclosure pattern (button `aria-expanded` + list of links, no `role=menu`). Mega menu tabs (`role=tablist` with links) similar. Escape handling and roving focus exist for the rail (`:828-851`) — good.
- Modals use Radix `Dialog` (focus trap, Esc, return-focus provided) — good. But error messages in lead modals have no `aria-invalid`/`aria-describedby`/`role="alert"` (0 matches in all modal files and `application-form.tsx`; `match/page.tsx` 1). WCAG 3.3.1/4.1.3. Add live region for step changes and submit result (and for the fake-success issue P0-1).
- Mobile menu is a Radix `Sheet` (OK). `aria-label="Open menu"` present.
- Touch targets (2.5.8, 24 px min; 44 recommended): `Button` default `h-11`, `sm` `h-9` OK; `NavDropdown` chevron button is `p-0.5` around a ~14 px icon (`header.tsx:416`, `:878`) -> ~18 px, fails 2.5.8; mobile contact links lack `min-h-[44px]` except WhatsApp.
- 19 occurrences of `outline-none` without `focus-visible` partner — audit for visible focus (2.4.7/2.4.13). `Input` has `outline-none` + ring classes (ok if ring present).
- Reduced motion: global `@media (prefers-reduced-motion: reduce)` clamps animation/transition (`globals.css:444`) and the carousel checks `matchMedia` — good. Auto-advancing `reviews-carousel` needs pause control (2.2.2).
- Images: `alt=""` count 0; alt present on all inspected `<img>`s.
- Forms: labels with `htmlFor` and `autoComplete` present in buyer modal — good (1.3.5).

### P2-5 DevOps
- `Dockerfile`: multi-stage, non-root, standalone — good. Issues: `COPY --from=builder /app/prisma ./prisma` but generated Prisma client / engines under `node_modules/.prisma` are only included if the standalone tracer picks them up (verify `ls /app/node_modules/.prisma` in the image; with the pg adapter + `prisma-client-js` it usually does, but unverified); `prisma migrate deploy` is never run and `prisma/migrations` is dockerignored AND does not exist in repo (`ls prisma` = `schema.prisma` only) -> schema applied by hand/`db push`? Add migrations and a release step. No `HEALTHCHECK`. `.dockerignore` has typo `!env.example` (and `.env.example` is itself git-ignored by `.env*`; add `!.env.example` to `.gitignore` so the template is tracked).
- `railway.json`: no `healthcheckPath`/`healthcheckTimeout`; `startCommand` duplicates CMD. No `/api/health` route exists (`grep` empty) — Railway cannot gate deploys. `docker-compose.yml` healthcheck hits `/` (heavy, needs Sanity) and defaults `NEXTAUTH_SECRET: changeme` (also wrong var names for v5: `AUTH_SECRET`/`AUTH_URL`) and publishes Postgres 5432 with default creds.
- Observability: no Sentry/OpenTelemetry/Pino; errors are `console.error` only (some with PII); no uptime monitor. Add Sentry (`@sentry/nextjs`, `instrumentation.ts` `onRequestError`), strip PII.
- Env handling: `.env.example` lacks `AUTH_TRUST_HOST`, `CAREERS_EMAIL`, `NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS`; nothing validates env at boot — add `lib/env.ts` (zod) imported from `instrumentation.ts`. `RESEND_API_KEY` missing or `re_xxx` makes email silently "mock success" (`resend.ts:8,32`) — in production that means lost admin notifications with `success:true`; throw/log loudly when `NODE_ENV==='production'`.
- Careers: `/careers` currently 404 via proxy (verified `curl` 404, `no-store`); `applications` route double-gated. Good, but also covered only by a skipped test (needs `HAUS_CAREERS_TEST_URL`).
- `package.json`: `next.config.ts` emits `MODULE_TYPELESS_PACKAGE_JSON` warning (add `"type":"module"` or rename config `.mjs`); `tsconfig.tsbuildinfo` is untracked, fine; `@types/node ^20` vs runtime Node 22.

---

## P3 — low
- 37 `react/no-unescaped-entities` errors in legal pages/funnel: bulk-fix with `&apos;`; 21 `no-require-imports` in `scripts/*.js` -> add eslint override for `scripts/**` or convert to ESM. Make `npm run lint` green and enforce in CI.
- `lint` script has no `--max-warnings`; add `typecheck` script (`tsc --noEmit`) — currently none.
- `X-Powered-By` header (set `poweredByHeader:false`).
- `Sanity` `apiVersion '2026-02-01'` pinned (good); `groq`, `@sanity/client` duplicated by `next-sanity` — check dependency duplication.
- `Reveal` uses `useEffect` setState; fine. `TableOfContents.tsx:48` sync setState in effect -> derive in render/useMemo.
- `search-filters.tsx` creates a component during render (dead code; delete).
- `console.log` of PII in `funnel/route.ts:105` — remove (GDPR/UK DPA exposure in Railway logs).
- PII at rest: Lead rows store name/phone/email/consent boolean but **no consent timestamp, IP, or policy version** — add `consentAt`, `consentVersion` for GDPR proof; no retention/erase job.
- `sendWelcomeEmail` promises "within 2 hours" — ensure SLA copy matches ops.

---

## Quick wins an engineer can ship in <1 day (ordered)
1. Remove `Math.random()` match count + copy (P0-2) — 15 min.
2. `escapeHtml` in welcome/login-alert/lead-notification emails; strip CRLF in subjects (P1-3) — 30 min.
3. `next.config.ts`: add `headers()` (Report-Only CSP + HSTS, XFO/`frame-ancestors`, nosniff, Referrer-Policy, Permissions-Policy), `poweredByHeader:false`, `images.formats`, drop dicebear (P0-3) — 2 h.
4. Check `res.ok` in 4 client forms and show error + phone/WhatsApp fallback (P0-1b) — 2 h.
5. `npm i next@16.4.2 eslint-config-next@16.4.2 next-auth@latest @auth/prisma-adapter@latest resend@latest`; run tests + manual smoke (P0-4) — 2-3 h.
6. `git rm -r --cached studio-haus-of-estate/node_modules` + `.gitignore` `node_modules/` + `!.env.example` (P0-5) — 10 min.
7. Add `app/api/health/route.ts` (returns 200 + optional `SELECT 1` on `?deep=1`), `railway.json` `healthcheckPath` (P2-5) — 20 min.
8. Add `app/error.tsx`, `app/global-error.tsx`, `loading.tsx` for /properties and /blog (P1-5a) — 1 h.
9. Replace `text-gold-500` text with `text-gold-700` via a `--color-gold-text` token (P2-4) — 1 h.
10. Change inner `<main>` to `<div>` in two blog pages — 5 min.
11. Delete dead components/dirs/mock data and unused deps; green the lint with `eslint` override for `scripts/**` — 1-2 h.
12. Add `typecheck` + `test` npm scripts (include blog/property tests) — 10 min.
13. `timingSafeEqual` + secret-length guard in revalidate route; cap blog `q` length — 30 min.

---

## 6. Recommended test strategy and CI

**Pyramid**
1. Unit (node:test, already used; keep zero-dep): extract and test `lib/leads/score.ts` (intent/budget/urgency matrix, tiers), `lib/leads/schema.ts` (zod accept/reject, injection payloads `{"contains":""}`, 10 kB strings), `escapeHtml`/email templates (snapshot, assert no raw `<`), `careers-availability`, `property-taxonomy`, `seo` helpers. Add all `tests/*.test.mjs` to a single `npm test`.
2. API integration (node:test + real Postgres service container + `RESEND_API_KEY` unset spy): POST `/api/leads` happy/invalid/duplicate-email/rate-limited; `/api/funnel` persists; `/api/auth/register|login` (enumeration, lockout); revalidate secret.
3. E2E Playwright (against `next build && next start`, Chromium + WebKit, Pixel 7): (a) buyer modal full path -> assert request payload, success + DB row; (b) simulate 500 -> asserts visible error (guards P0-1); (c) match funnel; (d) consent banner gates GA (existing analytics specs); (e) `/careers` 404 (replace skipped test; set `HAUS_CAREERS_TEST_URL` in CI); (f) keyboard-only: skip link, open/close mega-menu with Esc, modal focus trap/return.
4. A11y: `@axe-core/playwright` on `/`, `/properties`, `/properties/monaco-mansions`, `/blog`, `/contact`, `/faq`, `/about`, each at 390 and 1280 px, fail on `serious|critical` (tags `wcag2a,wcag2aa,wcag22aa`); would catch gold contrast and nested `<main>`.
5. Visual regression: Playwright `toHaveScreenshot` (threshold 0.2%, `animations:'disabled'`, Sanity pinned via `NEXT_PUBLIC_SANITY_DATASET=test` fixture dataset or mocked route) on same pages, desktop + mobile; baselines stored in repo via git LFS or in CI artifacts.
6. Performance budget: Lighthouse CI (mobile) on `/`, `/properties`, a property, `/blog`: LCP <= 2.5 s, CLS <= 0.1, TBT <= 200 ms, JS transfer budget (set after first prod measurement).
7. Security: `npm audit --omit=dev --audit-level=high` (non-blocking at first), Gitleaks, CodeQL, Dependabot (weekly, group `next`/`next-auth`/`prisma`).

**GitHub Actions** (`.github/workflows/ci.yml`; none exists today):
```yaml
name: ci
on: { pull_request: {}, push: { branches: [main] } }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
jobs:
  static:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test            # node --test tests/*.test.mjs
      - run: npm audit --omit=dev --audit-level=high || true
  e2e:
    needs: static
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_PASSWORD: ci, POSTGRES_DB: hoe }
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://postgres:ci@localhost:5432/hoe
      AUTH_SECRET: ci-only-secret
      NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ vars.SANITY_PROJECT_ID }}
      NEXT_PUBLIC_SANITY_DATASET: ${{ vars.SANITY_DATASET }}
      HAUS_CAREERS_TEST_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci && npx prisma generate && npx prisma migrate deploy
      - run: npm run build
      - run: npx playwright install --with-deps chromium webkit
      - run: npm run start & npx wait-on http://localhost:3000
      - run: npx playwright test    # e2e + axe + visual
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
  lighthouse:
    needs: e2e
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps: [ ... treosh/lighthouse-ci-action@v12 with urls + budgets ... ]
```
Protect `main`: require `static` + `e2e`; Railway deploys only from `main` with healthcheck gating.

**Suggested `next.config.ts` headers (starting point)**
```ts
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.sanity.io",
  "img-src 'self' data: blob: https://cdn.sanity.io https://images.unsplash.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'", "font-src 'self' data:",
  "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
].join('; ')
async headers() { return [{ source: '/((?!studio).*)', headers: [
  { key: 'Content-Security-Policy-Report-Only', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' }, { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' } ] }] }
```
(Tighten `script-src` with nonces via `proxy.ts` once stable; `unsafe-inline` is needed for the JSON-LD/inline bootstrap today. Promote Report-Only to enforcing after a week of clean reports.)

## Appendix: other verified-OK items
- No secrets in client code: only `NEXT_PUBLIC_*` + Sanity project id (public) read client-side; `RESEND_API_KEY`, `DATABASE_URL`, `AUTH_*` server-only.
- No SSRF surface: server never fetches user-supplied URLs (`applications` only validates `linkedinUrl`/`portfolioUrl` as `https?://` strings and embeds them escaped in an email `href` — `javascript:` is excluded by `URL_RE`).
- No open redirects: `proxy.ts` redirects to fixed `/`; Auth.js `callbackUrl` is same-origin-checked.
- `dangerouslySetInnerHTML` used only for JSON-LD from server constants/`JSON.stringify` (3 places); blog/faq JSON-LD embeds CMS strings — ensure `<` is escaped (`JSON.stringify(...).replace(/</g,'\\u003c')`) in `faq/page.tsx:93` and `blog/[slug]/page.tsx:128` (P3).
- `.env`, `.env.local`, `.env.docker` untracked and absent from git history.
- Analytics are consent-gated, host-allow-listed, and covered by tests.
- CV upload: 5 MB cap, extension/MIME check, base64 e-mail attachment (no disk write); MIME is client-declared and the regex accepts any `.pdf/.doc/.docx` name — acceptable for an email attachment, but run AV scan if CVs are ever stored.
