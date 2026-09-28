# Deb: Release 2 build and activation handoff — 28 September 2026

**Ship in two stages:** (1) release the reviewed website with unfinished backend features off; (2) activate website enquiries only after a hosted save, Google Sheet row and staff inbox receipt are verified. The enquiry implementation already exists. Customer acknowledgements and personalised marketing are later implementation work.

Compared using Git log/diff from merged [PR #15](https://github.com/deb-pradhan/Haus-Of-Estate/pull/15), `20afdeeb`, to Release 2 `5163f9ac`. Continue the cumulative `suryak02/azizi-florence-content-scaffold` branch and [draft PR #16](https://github.com/deb-pradhan/Haus-Of-Estate/pull/16). Preserve Release 1 SEO/consent changes; do not recreate the retired SEO branch. This document describes prepared code, not a completed production deployment.

## What changed since PR #15

| Area | Implemented result |
| --- | --- |
| Property discovery | UK/UAE/Greece navigation; keyword search; residential/commercial sale and rental modes; inventory-derived locations; source-currency budget comparisons, currency choices and corrected dirham alignment. Empty searches stay honest. |
| Developer partners | Ten supplied/original-colour logos in a compact continuous carousel, drag/momentum, pause over the strip, keyboard support and a reduced-motion grid. |
| Company, team and blog | Sonia's approved Founder profile/photo/social links; company blog attribution; revised thumbnail framing; verified company/ICO identity and separately labelled registered/trading addresses; supplied PolicyBee badge; removal of remaining parked badge claims. |
| Careers | Nine current roles from `content/careers-roles.json`, including Social Media Account Manager (Intern). The revised UK/international roles supersede the earlier list; Sales Specialist/unknown routes remain retired. Careers hides phone/WhatsApp and uses `careers@hausofestate.com`. Browsing is open in code; application intake remains gated. |
| Services | Snagging guidance; separate Maintenance page for plumbing/electrical installation; Interiors & Renovations on the existing `/renovations` route with Design/Renovate/Furnish/Finish, room/goal brief and illustrative lighting controls. No unsupported packages, prices or project photographs. |
| Tools and SEO | Mortgage/EMI illustration, published-only HTML/XML sitemaps, additional consented analytics route coverage, canonical sharing and `/cookie-policy` redirect. `/ask` redirects to the enquiry page. |
| Enquiries | Contact-first forms, independent optional newsletter/property-match choices, validated durable receipts, preserved failure/retry input, interiors brief support and honest unavailable states. Lead, consent and separate staff/Sheets delivery events are saved together; unsupported upload controls and false-success fallbacks are removed. |
| CMS and deferred features | Sanity editorial/preview tooling, standalone Studio setup and property/media drafts are prepared. Account security, saved content and AskHaus implementations remain in the branch but are disabled. Prepared content does not become published merely by deploying the app. |

The separately authorised Al Furjan/Monaco off-plan correction was already applied to published CMS records on 21 September; do not repeat a broad content publication. Detailed evidence: [25 September revision](website-revision-2026-09-25.md), [interiors follow-up](interiors-implementation-2026-09-27.md), [22 September update](website-update-2026-09-22.md).

## Stage 1 — deploy the website, keep backend intake off

Deb reviews/merges the agreed revision through PR #16 and deploys that exact commit using the existing web `railway.json` / `Dockerfile`. Node 22 is used by both Docker images; dependencies are pinned by `package-lock.json`. Preserve configured public site/Sanity settings and use the approved dataset; the existing production project is `jdxbkry4`. Do not run draft import/publication scripts as part of deployment.

Set these runtime flags explicitly to lowercase `false`: `AUTH_ENABLED`, `SAVED_CONTENT_ENABLED`, `PROPERTY_ASSISTANT_ENABLED`, `LEAD_INTAKE_ENABLED`, `LEAD_DELIVERY_ENABLED`, `LEAD_SHEETS_ENABLED`, `CAREERS_INTAKE_ENABLED`. Keep delivery disabled on any existing separate worker too; Stage 1 does not need a worker. Keep `BOT_PROTECTION_ENABLED` and `NEXT_PUBLIC_SANITY_SOCIAL_CAMPAIGNS_ENABLED` off unless separately approved. Leave `HAUS_DATABASE_MIGRATIONS_APPROVED` empty. Approved careers browsing is a code allowlist, not an environment flag to reopen historical roles.

The web pre-deploy command is **`npm run db:prepare-release`**. With auth/intake/delivery off it skips database work, allowing this content release without new database/mail/Google credentials. Do not replace it with unconditional migration execution. Root rendering checks runtime readiness; do not put database or mail secrets into Docker build arguments. The declared `NEXT_PUBLIC_*` arguments are build-time configuration, including the public site/Sanity settings and any verified GTM container ID. The build still needs network access to its existing Sanity/font dependencies; public dataset reads do not require a Sanity write token.

For a clean local/CI checkout, these commands are defined in `package.json`:

```sh
npm ci
npm run db:generate
npm run typecheck
npm test
npm run test:seo
npm run studio:validate
npm run build
```

`db:generate` generates the Prisma client; it does not apply SQL. `npm run build` is `next build`; `npm start` is the non-Docker `next start`. Railway's standalone image starts **`node server.js`**, as already configured. The Dockerfile installs dependencies, generates Prisma and builds; Deb need not reimplement these features or rebuild their architecture.

Stage 1 acceptance: confirm the deployed commit, published property/blog rendering, search modes, carousel, Sonia/team/footer/legal details, nine current roles, retired-role 404s, service pages, calculator and both sitemaps. Check desktop/mobile navigation and absence of overflow. Enquiry, matching, seller and application routes must show honest unavailability with their intake off; no legacy form may claim a receipt. Account/AskHaus entry points stay unavailable. Preserve consent-controlled analytics; a passing build is not GA4 receipt.

## Stage 2 — activate the existing normal website form

Use [the exact variable/owner setup list](lead-activation-handoff-2026-09-28.md#one-setup-list-for-deb-normal-website-form); it includes the actual approved spreadsheet ID, required headers and evidence checklist. No new form API, Google adapter or notification adapter needs building for this stage.

1. **Deb:** back up the hosted PostgreSQL database, compare schema/migration history and review the complete pending migration set. Use `npm run db:migrate:approved` through the existing gate and its exact generated `HAUS_DATABASE_MIGRATIONS_APPROVED` pending-set/checksum value only after approval. Remove that temporary value after rollout. Do not guess the hosted baseline or mark additive SQL applied without verification.
2. **Deb:** stop the old delivery worker before creating destination-specific events; deploy the destination-aware app/worker together. The migration `20260925120000_lead_delivery_destinations` preserves old notification states and does not backfill historical Sheet rows. Never roll an old worker back against the new queue. See [migration controls](../prisma/migrations/README.md).
3. **Company Google/mail administrators and Sonia:** provide a service account with Sheets API enabled and access to the approved Sheet, a dedicated website tab with exact headers, and an authorised mail sender/monitored staff inbox. Credentials and existing provider access have not been verified. Keep native `Form responses 1` separate from the website tab.
4. **Deb:** smallest setup is web `LEAD_INTAKE_ENABLED=true` with `DATABASE_URL` and production `LEAD_RATE_LIMIT_SECRET`, but web `LEAD_DELIVERY_ENABLED=false`. Configure the separate worker's database, Sheets and mail variables; enable its delivery/Sheets flags for controlled testing. This avoids putting delivery credentials on the web service and leaves auth/AskHaus off.
5. **Deb:** use `railway.worker.json` / `Dockerfile.worker` from the same revision. They run `node dist/process-lead-deliveries.cjs` in a bounded batch every five minutes. The existing `npm run lead-delivery:worker` is the source-checkout command, not a replacement for the packaged Railway worker. Review pending events before enabling delivery.
6. **Deb + Sonia, with Surya checking:** prove one database Lead, two destination events, one actual Sheet row and one actual staff inbox notification; test repeat submission and independent failure/retry. Record revision, migration state and worker result, then open customer intake. API success proves durable save, not downstream delivery.

Resend, ZeptoMail and Power Automate adapters exist; explicitly select the approved provider because the legacy default is Power Automate. There is no clean notification-off flag yet: missing mail credentials do not block Sheets independently, but cause failed notification retries. Use both intended destinations or request a separate Sheets-only switch; do not simulate email-off with broken credentials.

Careers activation is separate: `CAREERS_INTAKE_ENABLED=true` requires a verified Resend sender/key and actual recruiter/applicant receipt checks, including CV handling. It is an email-only endpoint, not a durable application database/worker. Careers does not require enabling accounts or the lead database.

## Already verified, and what still needs proof

- Recorded 25 September evidence: **510 unit tests/67 files**, production build/TypeScript, seven SEO checks, four careers checks, six consent browser checks and twelve production enquiry browser tests passed. These browser submissions were mocked; no hosted database/mail/Sheet receipt was established.
- Recorded 27 September evidence: **39 focused checks**, scoped lint and isolated production build passed for interiors/carousel follow-up; desktop/mobile interaction, validation, private-field URL exclusion and honest database-failure handling were inspected. These are dated results, not a fresh full-suite run at this documentation commit.
- Repeat deployment-relevant checks on the release commit. Available browser commands: `npm run test:analytics:browser` and `npx playwright test --config playwright.lead-production.config.ts`; the latter isolates credentials and mocks submissions. `npm run test:careers-offline` verifies the careers policy, and `npm run studio:validate` validates schema. Hosted acceptance remains separate.
- The [standalone Google Form](https://forms.gle/7fwMEN83ySQoMhps8) is published; **Accepting responses** and **Anyone with the link** were reconfirmed on 28 September. Look in [Form responses 1](https://docs.google.com/spreadsheets/d/1VTc6AFWWBvm5RZP1t6WIEkdy1WsTFG9hI04s53j2EiE/edit?gid=1390037075#gid=1390037075), where the marked test remains in `A2:H2`, rather than the blank `Sheet1` (`gid=0`). This is independent of website intake or email outreach. Surya currently owns the Form; company handover remains to agree.

## Separate work and holds

**Genuinely unbuilt outreach:** automatic customer acknowledgement and personalised marketing need their own implementation, approved templates, subscriber eligibility/verification, consent-aware selection, scheduling/deduplication, unsubscribe/suppression and provider receipt tests. Staff notifications are not campaigns; analytics cookies neither provide an email address nor grant newsletter/property-match permission. A subscriber pilot can be built without accounts/AskHaus. See [the distinct milestones](lead-activation-handoff-2026-09-28.md#email-outreach-and-cookies-are-separate-milestones).

**Keep held:** Florence and Cardiff/Manchester draft publication, outstanding blog covers/articles and other team profiles, unconfirmed interiors packages/prices/case studies, Complaints Procedure and Website Disclaimer pending approved text. Keep auth/saved/AskHaus off. GA4 still requires the company's actual `GTM-…` container/configuration and real consented receipt verification; `G-FEZF22MELJ` and `GT-55K83XLJ` are not container IDs. Do not add a duplicate tracking snippet.

**Return to Surya:** deployed commit/URL and Stage 1 checks; then migration/worker status, actual Sheet/inbox proof and unresolved configuration items for Stage 2. Sonia owns business wording/destination confirmation; Deb owns hosting execution; Surya owns code verification. Four original May SEO reports and the reported 62/70 completion remain unreconciled evidence, not a release-completion claim.

This handoff changes documentation only. It does not authorise or perform deployment, SQL execution, content publication or outgoing customer messages. Existing unrelated local edits/assets are outside the handoff.
