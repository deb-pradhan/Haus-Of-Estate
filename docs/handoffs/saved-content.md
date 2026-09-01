# Haus of Estate saved-content handoff

Paste this into the separate ChatGPT account when continuing the work.

Repository: `deb-pradhan/Haus-Of-Estate`

Branch: `suryak02/saved-content`, stacked on `suryak02/auth-hardening`. Never
push or merge directly to `main`; review and merge auth hardening first, then
rebase this branch if its parent changes.

The branch adds a disabled-by-default saved-content system. Guests can heart
properties and bookmark articles locally. On sign-in, those references merge
idempotently into the authenticated account. PostgreSQL stores only content
type plus immutable Sanity ID; the `/saved` Properties and Articles tabs always
rehydrate current published Sanity data and omit archived/deleted items.

The authenticated `GET`, `PUT`, and `DELETE /api/saved` handlers reject forged
identity fields, scope every database operation to the session user, validate
publication before saving, require same-origin mutations, and expose generic
PII-free failures. The additive migration is committed but has not been applied
to Railway. Use the reviewed checksum approval process in
`prisma/migrations/README.md` after a backup and live-schema comparison.

Verification at branch freeze: Prisma validate/generate, TypeScript, focused
lint, 68 Vitest tests, all 22 desktop/mobile Playwright checks, and the 76-route
production build pass. Full-repository lint still reports 77 errors and 30
warnings in pre-existing scripts, legal pages, funnel code, and legacy
components; every file changed by this branch passes. Real multi-account
isolation and migration replay still need a staging PostgreSQL database before
`SAVED_CONTENT_ENABLED=true`.

The future AI assistant is deliberately not included. Its secure auth/Sanity
stack and `LeadEoiForm` currently live in separate draft PR chains; reconcile
those dependencies after review rather than importing conflicting migrations.
