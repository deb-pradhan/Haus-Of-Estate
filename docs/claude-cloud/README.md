# Haus: portable Claude development brief

Prepared 6 November 2026. This file is safe for the public source repository. The longer private handoff supplied separately is context, not a substitute for checking current code and service state.

## Start here

Read `AGENTS.md`, this file and `GOAL.md`. `CONTINUATION.md` records the first cloud milestone (the `/showcase` fixture preview), its checks and open decisions. Inspect the installed Next.js documentation before changing framework code. Build a tangible responsive concept early; do not spend the whole task producing another plan.

Start from `suryak02/claude-cloud-handoff`, the sanitized cloud continuation of Release 2, not deployed main. The canonical Release 2 branch is `suryak02/azizi-florence-content-scaffold`; its latest local work through `3b895b15` also contains private correspondence/held material that must not be published wholesale. This cloud branch carries the useful application changes without that private history. Inspect the export note for exclusions. Preserve the canonical work. Use one coherent review branch/session; do not create branches for every feature.

Compare these before integrating:

- `main` was `5d30c03d` at the audit; PR #20 added focused Florence/Kore presentation support, the dirham symbol and blog imagery work.
- PR #16 is the cumulative draft and is not a safe wholesale merge.
- PR #18 (`mega-upgrade`, audited head `f1f4f469`) is a separate overlapping design/trust/SEO upgrade. Inspect its actual diff and reuse good ideas without overwriting working behaviour.
- PR #17 delivered the urgent London/footer changes. Code delivery, CMS publication and hosting deployment are separate steps.

## First deliverable

Produce a clear mobile and desktop journey: homepage -> property search/catalogue -> Florence community -> villa/townhouse collection -> named design and floor plan -> simulated brochure request -> example email. Include the London listing as the ready-home comparison. Give the user a working preview, evidence of checks, and a concise account of changes and remaining decisions.

Creative direction is open: improve hierarchy, typography, spacing, imagery, navigation, motion and accessibility. Use 100xlab as a quality reference and UAE real estate sites such as Bayut for discovery patterns, not as sources of property facts or copied assets. Keep the experience appropriate to real buyers. Prefer fewer clear decisions to dense rows of controls. Use at least 44px primary touch targets, visible keyboard focus, usable contrast and reduced-motion support.

Preserve the approved intent: a wide Florence community introduction above separate Villas and Townhouses sections; country -> city -> area search; useful global property/article search; relevant image/design matching; uncropped floor plans; actual dirham symbol with consistent baseline/price typography; white compact PolicyBee badge; truthful company/footer details. New logo/Appollo font files and their final typography roles are not established. Currency conversion, AskHaus, mortgage calculator, accounts/saved content and unfinished intake stay out of this initial concept.

## Portable content

Use `fixtures/haus-properties.json` and its README for display-only approved-source content and Sanity CDN images. This is not a CMS import or an inventory feed. The fixture excludes private evidence, private brochures and current commercial offers that require rechecking.

- Florence is in Sharjah, UAE, by Azizi Developments. One community, five bedroom/type collections and 19 brochure designs. Planned facilities must not appear operational. Do not label interchangeable interior choices as buyer-selectable until confirmed.
- Public plans and both area figures are intended. Use Built-up area for the Florence figure stored as `sellableAreaSqFt`; preserve source semantics internally. Keep disputed plot figures withheld.
- Old Florence prices are not current stock confirmation. Payment terms, handover and available inventory require refreshed approval. Do not present held values as current offers.
- London: three-bedroom terraced house; the supplied asking price is GBP 500,000. Approximate gross internal floor area is 889.9 sq ft / 82.67 sq m. Broad North London only, no road/postcode/precise map. BEFORE/AFTER images distinguish existing views and proposed concepts. Gross internal area is not plot size.
- Kore is explicitly on hold for this release (Surya, 6 November 2026). Preserve the existing draft and preparation work, but leave it out of the showcase, public catalogue and enquiry/brochure choices. Phase 1 is reported sold out; this does not establish that the whole project is sold out. Resume only when Sonia confirms a marketable phase or specific units, current commercial details and approved media. Do not present the earlier prices as current offers.

CDN images are already optimized source derivatives. Never copy the multi-GB original packages into Git, upload private PDFs as public assets, or use one project's renders for another. The existing Windows local bundle loader is deliberately strict and cannot be made portable by just copying its folder. Its `/dev` routes must remain unavailable in production.

## Cloud setup and preview boundaries

Claude cloud runs on a remote machine and clones GitHub. A desktop Project upload, local Downloads folder, local secret file or local unpushed commit is not automatically available there. No Resend, database or CMS write credential is needed for this concept.

Use the repository root with Node 22, `npm ci`, then `npm run db:generate`. Run only client generation, not migrations. Do not use the tracked legacy `studio-haus-of-estate/node_modules` tree: it contains old platform-specific dependencies and is not the root install. Cleanup/history rewriting is outside this task.

Do not run Railway's `db:prepare-release`, seed/import scripts or delivery workers. Keep `AUTH_ENABLED`, `SAVED_CONTENT_ENABLED`, `PROPERTY_ASSISTANT_ENABLED`, `CAREERS_INTAKE_ENABLED`, `LEAD_INTAKE_ENABLED`, `LEAD_DELIVERY_ENABLED`, `LEAD_NOTIFICATIONS_ENABLED`, `BROCHURE_EMAIL_ENABLED`, `LEAD_SHEETS_ENABLED` and `RESEND_WEBHOOK_ENABLED` false. Leave credentials, database URL, analytics IDs, brochure catalog/root and signing secrets unset. Inspect `scripts/run-brochure-demo.mjs` for the existing isolation contract; its Windows bundle argument is not the cloud solution.

A hosted concept needs an explicit fixture adapter/showcase route or separate isolated app that works with a normal production build. Do not set hosted `NODE_ENV=development`, weaken existing `/dev` guards or expose real drafts through public Sanity queries. Mark every demo route noindex, exclude it from sitemaps and require deployment protection before sharing a hosted preview. A noindex tag alone is not access control.

Vercel is optional for coding. A protected preview deployment needs the intended account/team/project connection; access in another assistant does not transfer to Claude. Use a separate preview project with no live domain, no production environment secrets, no background workers and no billing changes. Check plan eligibility for business use. Do not deploy until a concrete build passes and preview protection/access have been confirmed. If connection is missing, provide the working cloud preview and exact remaining setup rather than blocking all design work.

## Existing implementation to preserve or evaluate

- Shared property renderer, Sanity property schema and catalogue queries, design/floor-plan model, native draft IDs, current SEO URLs and publication guards.
- Native lead contract: durable save/receipt, staff notification, assigned follow-up and later marketing; a Sheet row or Resend send alone is not the full system.
- Separate requested brochure fulfilment from optional unticked marketing consent. No marketing opt-in required merely to receive a requested brochure.
- Brochure request must keep the chosen property and design through the form and email. Demo success must say simulated and must not call real lead/email endpoints or claim an email was sent.
- Production Resend domain and restricted sending capability have been verified separately. The whole website/database/outbox/worker/private-file/webhook flow is not thereby live. Activation still requires a compatible application/worker/schema deployment, approved database migration, runtime-only scoped credentials, private per-design PDF catalog and signing secret, retrying delivery worker, authenticated webhook and controlled end-to-end durable-save/inbox checks. Keep all of that disabled for this design preview. Sales routing is `sales@hausofestate.com`; careers remains `careers@hausofestate.com`.
- Preserve consent-gated GTM precedence and direct GA4 fallback, event allowlists, private/preview exclusions and receipt-gated submission-success events. Mocked tests do not prove live analytics receipt.
- Preserve canonical URLs, redirects, sitemap/robots behaviour, truthful structured data, article author credits and quality cover images. GEO/AEO improvements mean useful factual copy, attributable answers and consistent entities, not invented reviews or guaranteed rankings.
- Careers working-list content still has approval gaps. No invented job terms or personal staff phone numbers. Calendar bookings need confirmed staff calendars, availability rules and a real integration before showing bookable slots.

Alternative CMS/hosting/database/CRM choices are welcome only with a concrete benefit, migration/access/cost implications and rollback. Do not change the stack simply to create a fresh demo.

## Review evidence

Show a working 390px and 1440px journey, sensible empty/error/back states, accessible form labels and touch targets, preserved property/design choice, no overflow and clearly simulated email. Run typecheck, relevant lint/tests and a production build with separate build outputs where necessary. Report actual commands/results and blockers; do not call a stopped server or screenshots of an unrelated revision a verified preview.

Save changes and a continuation note on the session/release branch. No merge to main, production deployment, DNS change, CMS publication, migrations or real customer/staff messaging is authorized by this preparation brief.

## Official references

- Claude cloud: https://code.claude.com/docs/en/claude-code-on-the-web
- Claude goals: https://code.claude.com/docs/en/goal
- Model/effort/Ultracode: https://code.claude.com/docs/en/model-config
- Vercel MCP: https://vercel.com/docs/agent-resources/vercel-mcp
- Preview protection: https://vercel.com/docs/deployment-protection

No additional MCP is mandatory for the first fixture-based build. GitHub access and a browser/test tool are sufficient. Vercel is optional for hosting; Sanity is useful for later read-only verification; Resend is needed only when activating and testing delivery. Never copy credentials or personal mailbox data into project instructions.
